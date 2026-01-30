type IngestDefaults = {
  maxPerRun: number;
  maxPerSource: number;
  maxScrape: number;
  maxResolve: number;
  dailyLimit: number | null;
  minScore: number;
  minPercent: number;
};

const DEFAULT_MAX_PER_RUN = 300;
const DEFAULT_MAX_PER_SOURCE = 120;
const DEFAULT_MAX_SCRAPE = 40;
const DEFAULT_MAX_RESOLVE = 40;
const DEFAULT_DAILY_LIMIT = 1500;
const DEFAULT_MIN_SCORE = 3;
const DEFAULT_MIN_PERCENT = 15;

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseNumberAllowZero(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export function getIngestDefaults(): IngestDefaults {
  const dailyLimitRaw = parseNumberAllowZero(
    process.env.INGEST_DAILY_LIMIT,
    DEFAULT_DAILY_LIMIT
  );

  return {
    maxPerRun: parseNumber(process.env.INGEST_MAX_PER_RUN, DEFAULT_MAX_PER_RUN),
    maxPerSource: parseNumber(process.env.INGEST_MAX_PER_SOURCE, DEFAULT_MAX_PER_SOURCE),
    maxScrape: parseNumber(process.env.INGEST_MAX_SCRAPE, DEFAULT_MAX_SCRAPE),
    maxResolve: parseNumber(process.env.INGEST_MAX_RESOLVE, DEFAULT_MAX_RESOLVE),
    dailyLimit: dailyLimitRaw <= 0 ? null : dailyLimitRaw,
    minScore: parseNumberAllowZero(process.env.INGEST_MIN_SCORE, DEFAULT_MIN_SCORE),
    minPercent: parseNumberAllowZero(process.env.INGEST_MIN_PERCENT, DEFAULT_MIN_PERCENT),
  };
}

export function getDailyLimit(): number | null {
  return getIngestDefaults().dailyLimit;
}

export function getMinDealScore(): number {
  return getIngestDefaults().minScore;
}

export function getMinPercentOff(): number {
  return getIngestDefaults().minPercent;
}
