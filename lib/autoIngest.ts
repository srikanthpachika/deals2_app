import { prisma } from "@/lib/prisma";
import { ingestFeeds } from "@/lib/ingest";

type AutoIngestConfig = {
  enabled: boolean;
  staleMinutes: number;
  cooldownMinutes: number;
  maxPerRun: number;
  maxPerSource: number;
  maxScrape: number;
  maxResolve: number;
  minLiveDeals: number;
};

const DEFAULT_STALE_MINUTES = 10;
const DEFAULT_COOLDOWN_MINUTES = 3;
const DEFAULT_MAX_PER_RUN = 50;
const DEFAULT_MAX_PER_SOURCE = 50;
const DEFAULT_MAX_SCRAPE = 15;
const DEFAULT_MAX_RESOLVE = 15;
const DEFAULT_MIN_LIVE_DEALS = 30;

let inFlight: Promise<void> | null = null;
let lastRunAtMs = 0;

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getConfig(): AutoIngestConfig {
  return {
    enabled: parseBoolean(process.env.AUTO_INGEST_ON_REQUEST, true),
    staleMinutes: parseNumber(process.env.AUTO_INGEST_STALE_MINUTES, DEFAULT_STALE_MINUTES),
    cooldownMinutes: parseNumber(
      process.env.AUTO_INGEST_COOLDOWN_MINUTES,
      DEFAULT_COOLDOWN_MINUTES
    ),
    maxPerRun: parseNumber(process.env.AUTO_INGEST_MAX_PER_RUN, DEFAULT_MAX_PER_RUN),
    maxPerSource: parseNumber(process.env.AUTO_INGEST_MAX_PER_SOURCE, DEFAULT_MAX_PER_SOURCE),
    maxScrape: parseNumber(process.env.AUTO_INGEST_MAX_SCRAPE, DEFAULT_MAX_SCRAPE),
    maxResolve: parseNumber(process.env.AUTO_INGEST_MAX_RESOLVE, DEFAULT_MAX_RESOLVE),
    minLiveDeals: parseNumber(process.env.AUTO_INGEST_MIN_LIVE_DEALS, DEFAULT_MIN_LIVE_DEALS),
  };
}

async function shouldIngest(staleMinutes: number, minLiveDeals: number): Promise<boolean> {
  const latest = await prisma.deal.findFirst({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
      image: { not: null },
      price: { not: null },
      NOT: { price: "" },
      percentVerified: true,
      percentOff: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!latest) return true;
  const liveCount = await prisma.deal.count({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
      image: { not: null },
      price: { not: null },
      NOT: { price: "" },
      percentVerified: true,
      percentOff: { not: null },
    },
  });
  if (liveCount < minLiveDeals) return true;
  const ageMs = Date.now() - latest.createdAt.getTime();
  return ageMs > staleMinutes * 60 * 1000;
}

export async function maybeIngestFeeds(): Promise<void> {
  const config = getConfig();
  if (!config.enabled) return;

  const nowMs = Date.now();
  if (inFlight) return inFlight;
  if (lastRunAtMs && nowMs - lastRunAtMs < config.cooldownMinutes * 60 * 1000) {
    return;
  }

  const ingestNeeded = await shouldIngest(config.staleMinutes, config.minLiveDeals);
  if (!ingestNeeded) return;

  inFlight = ingestFeeds({
    maxPerRun: config.maxPerRun,
    maxPerSource: config.maxPerSource,
    maxScrape: config.maxScrape,
    maxResolve: config.maxResolve,
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      lastRunAtMs = Date.now();
      inFlight = null;
    });

  await inFlight;
}
