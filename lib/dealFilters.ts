const BLOCKED_KEYWORDS = ["sweepstakes", "contest", "giveaway", "raffle", "lottery"];
const DEAL_KEYWORDS = [
  "off",
  "save",
  "deal",
  "discount",
  "clearance",
  "coupon",
  "promo",
  "markdown",
  "price drop",
];
const FREE_KEYWORDS = ["free", "bogo", "buy one get one"];
const AMAZON_DOMAINS = ["amazon.com"];
const AMAZON_LINK_REGEX =
  /https?:\/\/(?:www\.)?(?:amazon\.com|amzn\.to|a\.co)\/[^\s"'<>]+/i;
const AFFILIATE_TAG = "deal2pro-20";

const TITLE_PREFIXES = [
  "new price low",
  "price drop",
  "deal alert",
  "hot deal",
  "deal of the day",
  "flash sale",
  "sale",
  "clearance",
  "markdown",
];

const EXTRA_HINTS = [
  "off",
  "save",
  "deal",
  "discount",
  "coupon",
  "prime",
  "free shipping",
  "shipping",
  "only",
  "size",
  "sizes",
  "color",
  "colors",
];

export function normalizeTitle(title: string): string {
  return sanitizeText(title);
}

export function trimText(text: string, max = 240): string {
  const cleaned = sanitizeText(text);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

export function extractPrice(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\$\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/);
  if (!match) return null;
  return `$${match[1]}`;
}

export function extractPercent(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d{1,2})\s?%/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function scoreDeal(text: string): number {
  const content = text.toLowerCase();
  let score = 0;

  if (extractPrice(text)) score += 3;

  const percent = extractPercent(text);
  if (percent) score += Math.min(5, Math.floor(percent / 10));

  if (FREE_KEYWORDS.some((keyword) => content.includes(keyword))) score += 3;
  if (DEAL_KEYWORDS.some((keyword) => content.includes(keyword))) score += 1;

  return score;
}

export function extractAmazonUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(AMAZON_LINK_REGEX);
  if (!match) return null;
  return match[0].replace(/[).,]+$/, "");
}

export function withAmazonAffiliateTag(url: string): string {
  const normalized = normalizeAmazonProductUrl(url);
  if (!normalized) return url;
  const parsed = new URL(normalized);
  parsed.searchParams.set("th", "1");
  parsed.searchParams.set("tag", AFFILIATE_TAG);
  return parsed.toString();
}

export function normalizeAmazonProductUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!AMAZON_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return null;
    }

    const asinMatch =
    parsed.pathname.match(/\/dp\/([A-Z0-9]{10})/i) ||
    parsed.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
    parsed.pathname.match(/\/gp\/aw\/d\/([A-Z0-9]{10})/i) ||
    parsed.pathname.match(/\/product\/([A-Z0-9]{10})/i);

    if (!asinMatch) return null;

    const asin = asinMatch[1].toUpperCase();
    return `https://www.amazon.com/dp/${asin}`;
  } catch {
    return null;
  }
}

export function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_name",
      "utm_id",
      "utm_source_platform",
      "utm_creative_format",
      "utm_marketing_tactic",
      "gclid",
      "fbclid",
      "igshid",
      "mc_cid",
      "mc_eid",
      "tag",
      "ascsubtag",
      "linkCode",
      "creative",
      "creativeASIN",
      "ref",
    ].forEach((key) => parsed.searchParams.delete(key));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function shouldSkipTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function normalizeDealTitle(
  title: string,
  description?: string | null
): { title: string; extras: string[]; percentOff: number | null } {
  const cleanedTitle = sanitizeText(title);
  const cleanedDescription = description ? sanitizeText(description) : "";
  const percentOff = extractPercentOff(`${cleanedTitle} ${cleanedDescription}`.trim());
  const extras: string[] = [];
  const baseTitle = cleanedTitle || sanitizeText(title);

  let working = baseTitle;

  for (const prefix of TITLE_PREFIXES) {
    const pattern = new RegExp(`^${escapeRegExp(prefix)}\\s*[:\\-]?\\s*`, "i");
    working = working.replace(pattern, "");
  }

  working = working.replace(/^amazon(?:\.com)?\s+has\s+/i, "");
  working = working.replace(/^amazon(?:\.com)?\s+deal\s*[:\\-]?\\s*/i, "");

  working = working.replace(/\b\d{1,2}\s?%\s*(?:off)?\b/gi, "");

  working = working.replace(/\$[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?/g, (match) => {
    extras.push(match.replace(/\s+/g, ""));
    return "";
  });

  const trailingAmazon = working.match(/\s+(?:at|on|from)\s+amazon(?:\.com)?\s*$/i);
  if (trailingAmazon) {
    working = working.replace(trailingAmazon[0], "");
  }

  const parenthetical = working.match(/^(.*)\(([^)]+)\)\s*$/);
  if (parenthetical && looksLikeExtra(parenthetical[2])) {
    extras.push(parenthetical[2]);
    working = parenthetical[1];
  }

  const commaMatch = working.match(/^(.*?),\s*([^,]+)$/);
  if (commaMatch && looksLikeExtra(commaMatch[2])) {
    extras.push(commaMatch[2]);
    working = commaMatch[1];
  }

  const splitMatch = working.match(/^(.*?)(?:\s*[-|]\s*)(.+)$/);
  if (splitMatch && looksLikeExtra(splitMatch[2])) {
    extras.push(splitMatch[2]);
    working = splitMatch[1];
  }

  let normalized = normalizeWhitespace(working);
  if (!normalized) {
    normalized = normalizeWhitespace(baseTitle);
  }

  if (percentOff !== null) {
    normalized = `${normalized} - ${percentOff}% off`;
  }

  return { title: normalized, extras: uniqExtras(extras), percentOff };
}

export function normalizeDealDescription(
  description: string | null | undefined,
  extras: string[]
): string | null {
  const cleaned = description ? sanitizeText(description) : "";
  const extraText = extras.filter((extra) => {
    const lower = extra.toLowerCase();
    return lower && !cleaned.toLowerCase().includes(lower);
  });
  if (!extraText.length) return cleaned || null;
  const suffix = `Details: ${extraText.join(" | ")}`;
  const combined = cleaned ? `${cleaned} ${suffix}` : suffix;
  return combined || null;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeText(value: string): string {
  if (!value) return "";
  const withoutCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  const withoutTags = withoutCdata.replace(/<[^>]*>/g, " ");
  return normalizeWhitespace(withoutTags);
}

function looksLikeExtra(value: string): boolean {
  const lower = value.toLowerCase();
  if (/\$[0-9]/.test(lower) || /\d{1,2}\s?%/.test(lower)) return true;
  if (/\d/.test(lower) && /\b(size|sizes|only|pack|count)\b/.test(lower)) return true;
  return EXTRA_HINTS.some((hint) => lower.includes(hint));
}

function extractPercentOff(text: string): number | null {
  const explicit = extractPercent(text);
  if (explicit) return explicit;
  const prices = extractPriceValues(text);
  if (prices.length >= 2) {
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    if (max > 0 && min > 0 && max > min) {
      const percent = Math.round(((max - min) / max) * 100);
      if (Number.isFinite(percent) && percent > 0 && percent < 100) return percent;
    }
  }
  const savings = extractSavingsValue(text);
  if (savings && prices.length >= 1) {
    const current = Math.min(...prices);
    if (current > 0) {
      const percent = Math.round((savings / (savings + current)) * 100);
      if (Number.isFinite(percent) && percent > 0 && percent < 100) return percent;
    }
  }
  return null;
}

function extractPriceValues(text: string): number[] {
  if (!text) return [];
  const matches = text.match(/\$[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?/g) || [];
  const values = matches
    .map((match) => Number(match.replace(/[^0-9.]/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  return Array.from(new Set(values));
}

function extractSavingsValue(text: string): number | null {
  if (!text) return null;
  const saveMatch = text.match(/save\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  const offMatch = text.match(/\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*off/i);
  const value = saveMatch?.[1] || offMatch?.[1];
  if (!value) return null;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function uniqExtras(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const cleaned = sanitizeText(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }
  return output;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
