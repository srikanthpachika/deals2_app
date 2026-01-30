import { prisma } from "../lib/prisma";
import { loadEnv } from "./loadEnv";
import { scrapeOG } from "../utils/scrape";

loadEnv();

async function main() {
  const limit = Number(process.env.IMAGE_BACKFILL_LIMIT || "60");
  const concurrency = Number(process.env.IMAGE_BACKFILL_CONCURRENCY || "4");
  const deals = await prisma.deal.findMany({
    where: {
      image: null,
      url: { startsWith: "https://www.amazon.com/dp/" },
    },
    take: Number.isFinite(limit) ? limit : 60,
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true },
  });

  let updated = 0;
  const queue = [...deals];
  const workerCount = Number.isFinite(concurrency) ? Math.max(1, concurrency) : 4;

  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const deal = queue.shift();
      if (!deal) return;
      try {
        const og = await scrapeOG(deal.url, { timeoutMs: 8000 });
        if (!og.image) continue;
        await prisma.deal.update({
          where: { id: deal.id },
          data: { image: og.image },
        });
        updated += 1;
      } catch {
        // skip failures
      }
    }
  });

  await Promise.all(workers);

  console.log("Backfill images:", { scanned: deals.length, updated });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
