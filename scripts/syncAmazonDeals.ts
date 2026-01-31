import { prisma } from "../lib/prisma";
import { scrapeOG } from "../utils/scrape";
import { getDealCreatedAtCutoff } from "../lib/dealExpiry";
import { getPercentMatchTolerance } from "../lib/percentModel";
import { loadEnv } from "./loadEnv";

loadEnv();

const DEFAULT_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const now = new Date();
  const cutoff = getDealCreatedAtCutoff(now);
  const delayMs = Number(process.env.SYNC_DELAY_MS || DEFAULT_DELAY_MS);
  const limitRaw = Number(process.env.SYNC_LIMIT || 0);
  const take = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
  const tolerance = getPercentMatchTolerance();

  const deals = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
      OR: [{ expiresAt: { gt: now } }, { createdAt: { gte: cutoff } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, percentOff: true, percentVerified: true },
    take,
  });

  console.log(`Syncing ${deals.length} deals...`);

  let updated = 0;
  let verified = 0;

  for (const deal of deals) {
    try {
      const scraped = await scrapeOG(deal.url, { timeoutMs: 12000 });
      const explicit =
        scraped.percentOff && scraped.percentOff > 0 && scraped.percentOff < 100
          ? scraped.percentOff
          : null;
      const computed =
        scraped.percentComputed &&
        scraped.percentComputed > 0 &&
        scraped.percentComputed < 100
          ? scraped.percentComputed
          : null;
      const isVerified =
        explicit !== null &&
        computed !== null &&
        Math.abs(explicit - computed) <= tolerance;
      const nextPercent = isVerified ? computed : null;

      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          percentOff: nextPercent,
          percentVerified: isVerified,
        },
      });
      updated += 1;
      if (isVerified) verified += 1;
    } catch (error) {
      console.warn(`Failed: ${deal.url}`);
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(`Updated ${updated} deals, verified ${verified}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
