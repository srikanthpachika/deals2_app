import { prisma } from "./prisma";
import { scrapeOG } from "../utils/scrape";
import { fetchFeed } from "../utils/rss";
import { FEED_SOURCES } from "./ingestSources";
import { getDealExpiresAt } from "./dealExpiry";
import { getIngestDefaults, getMinDealScore, getMinPercentOff } from "./ingestConfig";
import {
  buildPercentFeatures,
  getPercentMatchTolerance,
  loadPercentModel,
  savePercentModel,
  trainPercentModel,
} from "./percentModel";
import {
  cleanUrl,
  extractAmazonUrl,
  extractPrice,
  getDisplayPrice,
  isHttpUrl,
  normalizeDealDescription,
  normalizeDealTitle,
  normalizeAmazonProductUrl,
  normalizeTitle,
  scoreDeal,
  shouldSkipTitle,
  trimText,
} from "./dealFilters";

export type IngestReport = {
  sources: number;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  notes: string[];
};

type IngestOptions = {
  maxPerRun?: number;
  maxPerSource?: number;
  maxScrape?: number;
  maxResolve?: number;
};

const FEED_TIMEOUT_MS = 15000;
const OG_TIMEOUT_MS = 12000;
const RESOLVE_TIMEOUT_MS = 12000;

export async function ingestFeeds(
  options: IngestOptions = {}
): Promise<IngestReport> {
  const defaults = getIngestDefaults();
  const report: IngestReport = {
    sources: FEED_SOURCES.length,
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    notes: [],
  };

  const maxPerRun = options.maxPerRun ?? defaults.maxPerRun;
  const maxPerSource = options.maxPerSource ?? defaults.maxPerSource;
  const maxScrape = options.maxScrape ?? defaults.maxScrape;
  const maxResolve = options.maxResolve ?? defaults.maxResolve;
  const minScore = getMinDealScore();
  const minPercent = getMinPercentOff();
  let percentModel = await loadPercentModel();
  let percentModelDirty = false;
  const percentTolerance = getPercentMatchTolerance();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const countToday = await prisma.deal.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      url: { startsWith: "https://www.amazon.com/dp/" },
    },
  });

  const remainingToday =
    defaults.dailyLimit === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, defaults.dailyLimit - countToday);
  const remainingThisRun = Math.min(maxPerRun, remainingToday);

  if (remainingThisRun === 0 && defaults.dailyLimit !== null) {
    report.notes.push("Daily limit reached.");
  }

  const seen = new Set<string>();
  let scrapedCount = 0;
  let resolvedCount = 0;
  const now = new Date();

  outer: for (const source of FEED_SOURCES) {
    let items;
    try {
      items = await fetchFeed(source.url, { timeoutMs: FEED_TIMEOUT_MS });
    } catch {
      report.errors += 1;
      report.notes.push(`Feed failed: ${source.name}`);
      continue;
    }

    report.fetched += items.length;

    const rankedItems = items
      .map((item) => {
        const title = item.title || "";
        const description = item.description || "";
        const score = scoreDeal(`${title} ${description}`);
        const timestamp = item.publishedAt ? item.publishedAt.getTime() : 0;
        return { item, score, timestamp };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.timestamp - a.timestamp;
      })
      .slice(0, maxPerSource)
      .map((entry) => entry.item);

    for (const item of rankedItems) {
      const cleanedUrl = cleanUrl((item.url || "").trim());
      if (!cleanedUrl || !isHttpUrl(cleanedUrl)) {
        report.skipped += 1;
        continue;
      }

      const descriptionAmazonUrl = extractAmazonUrl(item.description || "");
      const descriptionUrl = descriptionAmazonUrl
        ? cleanUrl(descriptionAmazonUrl)
        : "";

      let amazonUrl =
        normalizeAmazonProductUrl(cleanedUrl) ||
        normalizeAmazonProductUrl(descriptionUrl);

      if (!amazonUrl && resolvedCount < maxResolve) {
        resolvedCount += 1;
        amazonUrl = await resolveAmazonFromPage(cleanedUrl, RESOLVE_TIMEOUT_MS);
      }

      if (!amazonUrl && descriptionUrl && resolvedCount < maxResolve) {
        resolvedCount += 1;
        amazonUrl = await resolveAmazonFromPage(descriptionUrl, RESOLVE_TIMEOUT_MS);
      }

      if (!amazonUrl) {
        report.skipped += 1;
        continue;
      }
      const url = amazonUrl;
      if (seen.has(url)) {
        report.skipped += 1;
        continue;
      }
      seen.add(url);

      let title = normalizeTitle(item.title || "");
      let description = trimText(item.description || "", 280);
      let price: string | null = null;
      let image: string | null = null;
      let sourceLabel = "amazon.com";
      let scrapedPercent: number | null = null;
      let scrapedPercentSource: "computed" | "structured" | "text" | null = null;
      let scrapedPrices: { list: number | null; current: number | null } | null = null;

      if (scrapedCount < maxScrape) {
        scrapedCount += 1;
        try {
          const og = await scrapeOG(url, { timeoutMs: OG_TIMEOUT_MS });
          if (!title) title = normalizeTitle(og.title || "");
          if (!description) description = trimText(og.description || "", 280);
          if (og.price) {
            const trimmed = og.price.trim();
            price = trimmed ? trimmed : null;
          }
          image = og.image || null;
          sourceLabel = og.siteName || sourceLabel;
          if (og.percentOff && og.percentOff > 0) {
            scrapedPercent = og.percentOff;
          }
          scrapedPercentSource = og.percentSource ?? null;
          scrapedPrices = og.prices ?? null;
        } catch {
          report.notes.push(`Scrape failed: ${url}`);
        }
      }

      if (!title) {
        report.skipped += 1;
        continue;
      }

      const rawTitle = title;
      const rawDescription = description;
      const normalized = normalizeDealTitle(title, description);
      title = normalized.title;
      description = normalizeDealDescription(description, normalized.extras) || "";
      if (description) {
        description = trimText(description, 280);
      }
      const fallbackPrice = extractPrice(`${rawTitle} ${rawDescription}`);
      const computedPercent =
        scrapedPrices?.list &&
        scrapedPrices.current &&
        scrapedPrices.list > scrapedPrices.current
          ? Math.round(
              ((scrapedPrices.list - scrapedPrices.current) / scrapedPrices.list) * 100
            )
          : null;
      const candidateFromScrape =
        scrapedPercentSource && scrapedPercentSource !== "computed"
          ? scrapedPercent
          : null;
      const candidateFromText = normalized.percentOff ?? null;
      const candidatePercentRaw = candidateFromScrape ?? candidateFromText;
      const candidatePercent =
        candidatePercentRaw && candidatePercentRaw > 0 && candidatePercentRaw < 100
          ? candidatePercentRaw
          : null;
      const candidateSource: "structured" | "text" | null =
        candidateFromScrape && scrapedPercentSource && scrapedPercentSource !== "computed"
          ? scrapedPercentSource
          : candidateFromText
          ? "text"
          : null;
      const candidateFeatures =
        candidateSource && candidatePercent
          ? buildPercentFeatures({
              source: candidateSource,
              percent: candidatePercent,
              hasList: Boolean(scrapedPrices?.list),
              hasCurrent: Boolean(scrapedPrices?.current),
              hasPrice: Boolean(price || fallbackPrice || scrapedPrices?.current),
            })
          : null;
      const postScore = scoreDeal(`${rawTitle} ${rawDescription}`);

      if (minScore > 0 && postScore < minScore) {
        report.skipped += 1;
        continue;
      }

      if (!title) {
        report.skipped += 1;
        continue;
      }

      if (shouldSkipTitle(title)) {
        report.skipped += 1;
        continue;
      }

      if (!sourceLabel) {
        try {
          sourceLabel = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          sourceLabel = "";
        }
      }

      const existing = await prisma.deal.findUnique({
        where: { url },
        select: { id: true, price: true, percentOff: true },
      });

      const scrapedCurrent = scrapedPrices?.current ?? null;
      const scrapedPrice = scrapedCurrent ? formatPriceValue(scrapedCurrent) : null;
      const ogPrice = price ? getDisplayPrice(null, null, price) : null;

      let finalPrice = existing?.price ?? null;
      if (scrapedPrice) {
        finalPrice = scrapedPrice;
      } else if (!finalPrice && ogPrice) {
        finalPrice = ogPrice;
      } else if (!finalPrice && fallbackPrice) {
        finalPrice = fallbackPrice;
      }

      if (
        computedPercent !== null &&
        candidatePercent !== null &&
        candidateSource &&
        candidateFeatures
      ) {
        const diff = Math.abs(candidatePercent - computedPercent);
        const label: 0 | 1 = diff <= percentTolerance ? 1 : 0;
        percentModel = trainPercentModel(percentModel, candidateFeatures, label);
        percentModelDirty = true;
      }

      let finalPercent: number | null = null;
      let percentVerified = false;
      if (computedPercent !== null && computedPercent > 0 && computedPercent < 100) {
        finalPercent = computedPercent;
        percentVerified = true;
      }

      if (!existing && finalPercent !== null && finalPercent < minPercent) {
        report.skipped += 1;
        continue;
      }

      if (existing) {
        try {
          await prisma.deal.update({
            where: { url },
            data: {
              title,
              price: finalPrice || null,
              image: image || null,
              description: description || null,
              source: sourceLabel || null,
              percentOff: finalPercent,
              percentVerified,
              expiresAt: getDealExpiresAt(item.publishedAt, now),
            },
          });
          report.updated += 1;
        } catch {
          report.errors += 1;
          report.notes.push(`Update failed: ${url}`);
        }
        continue;
      }

      if (report.created >= remainingThisRun && defaults.dailyLimit !== null) {
        report.skipped += 1;
        continue;
      }

      try {
        await prisma.deal.create({
          data: {
            title,
            url,
            price: finalPrice || null,
            image: image || null,
            description: description || null,
            source: sourceLabel || null,
            percentOff: finalPercent,
            percentVerified,
            approved: true,
            expiresAt: getDealExpiresAt(item.publishedAt, now),
          },
        });
        report.created += 1;
      } catch (error) {
        report.errors += 1;
        report.notes.push(`Create failed: ${url}`);
      }
    }
  }

  if (percentModelDirty) {
    await savePercentModel(percentModel);
  }

  return report;
}

function formatPriceValue(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const cents = Math.round(rounded * 100) % 100;
  const formatted = cents === 0 ? rounded.toFixed(0) : rounded.toFixed(2);
  return `$${formatted}`;
}

const FETCH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
};

async function resolveAmazonFromPage(
  url: string,
  timeoutMs: number
): Promise<string | null> {
  const page = await fetchPage(url, timeoutMs);
  const normalizedFinal = normalizeAmazonProductUrl(cleanUrl(page.finalUrl));
  if (normalizedFinal) return normalizedFinal;

  const extracted = extractAmazonUrlFromHtml(page.html);
  if (!extracted) return null;

  const normalizedExtracted = normalizeAmazonProductUrl(cleanUrl(extracted));
  if (normalizedExtracted) return normalizedExtracted;

  const resolvedShort = await resolveFinalUrl(extracted, timeoutMs);
  return normalizeAmazonProductUrl(cleanUrl(resolvedShort));
}

async function resolveFinalUrl(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });

    return res.url || url;
  } catch {
    return url;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchPage(
  url: string,
  timeoutMs: number
): Promise<{ finalUrl: string; html: string }> {
  const controller = new AbortController();
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });

    const html = await res.text();
    return { finalUrl: res.url || url, html };
  } catch {
    return { finalUrl: url, html: "" };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function extractAmazonUrlFromHtml(html: string): string | null {
  if (!html) return null;
  const direct = html.match(/https?:\/\/(?:www\.)?amazon\.com\/[^\s"'<>]+/i);
  if (direct) return direct[0];

  const encoded = html.match(/https%3A%2F%2F(?:www\.)?amazon\.com%2F[^\s"'<>]+/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[0]);
    } catch {
      return encoded[0];
    }
  }

  const short = html.match(/https?:\/\/(?:amzn\.to|a\.co)\/[^\s"'<>]+/i);
  if (short) return short[0];

  return null;
}
