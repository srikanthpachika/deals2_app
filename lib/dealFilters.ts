const BLOCKED_KEYWORDS = ["sweepstakes", "contest", "giveaway", "raffle", "lottery"];
const DEAL_KEYWORDS = [
  "off",
  "save",
  "deal",
  "discount",
  "clearance",
  "coupon",
  "coupon code",
  "clip coupon",
  "promo code",
  "promo",
  "extra savings",
  "extra discount",
  "stackable",
  "markdown",
  "price drop",
  "price cut",
  "price slash",
  "price crash",
  "price drop alert",
  "price reduction",
  "price decrease",
  "marked down",
  "mark down",
  "lowest price",
  "best price",
  "all-time low",
  "new low",
  "record low",
  "flash sale",
  "lightning deal",
  "limited time",
  "deal of the day",
  "exclusive",
  "member deal",
  "hot deal",
  "sale",
  "bundle",
  "bundle deal",
  "bundle discount",
  "doorbuster",
  "final sale",
  "last chance",
  "limited quantity",
  "prime day",
  "black friday",
  "cyber monday",
  "holiday deal",
  "today only",
  "limited stock",
  "price error",
  "price mistake",
  "steal",
  "mega deal",
  "blowout",
  "clearout",
  "special offer",
  "special deal",
  "limited offer",
  "one day",
  "today only",
  "exclusive deal",
  "member exclusive",
  "subscribe & save",
  "subscribe and save",
  "s&s",
  "prime exclusive",
  "prime deal",
  "instant savings",
  "rebate",
  "cashback",
  "digital coupon",
  "coupon applied",
  "extra coupon",
  "open box",
  "open-box",
  "refurbished",
  "warehouse",
];
const FREE_KEYWORDS = [
  "free",
  "bogo",
  "buy one get one",
  "buy 1 get 1",
  "2 for 1",
  "free shipping",
  "free gift",
  "freebie",
  "free trial",
];
const AMAZON_DOMAINS = ["amazon.com"];
const AMAZON_LINK_REGEX =
  /https?:\/\/(?:www\.)?(?:amazon\.com|amzn\.to|a\.co)\/[^\s"'<>]+/i;
const AFFILIATE_TAG = "deal2pro-20";

const TITLE_PREFIXES = [
  "new price low",
  "new low",
  "price drop alert",
  "price crash",
  "price drop",
  "deal alert",
  "hot deal",
  "deal of the day",
  "flash sale",
  "sale",
  "clearance",
  "markdown",
  "today only",
  "limited time",
  "limited stock",
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
  "oz",
  "fl oz",
  "lb",
  "lbs",
  "pack",
  "pack of",
  "count",
  "ct",
  "piece",
  "pcs",
  "inch",
  "inches",
  "ft",
  "feet",
  "gb",
  "tb",
  "color",
  "colors",
  "bundle",
  "multi-pack",
  "set",
  "value pack",
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
  const value = extractBestPriceValue(text);
  if (value === null) return null;
  return formatPriceValue(value);
}

export function getDisplayPrice(
  _title: string | null | undefined,
  _description?: string | null,
  fallback?: string | null
): string | null {
  if (fallback) {
    const fromFallback = extractPrice(fallback);
    if (fromFallback) return fromFallback;
    const cleaned = sanitizeText(fallback);
    if (cleaned.startsWith("$")) return cleaned;
    const parsed = Number(cleaned.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return formatPriceValue(parsed);
    }
  }
  return null;
}

export function scoreDeal(text: string): number {
  const content = text.toLowerCase();
  let score = 0;

  if (extractPrice(text)) score += 3;

  const percent = extractDiscountPercent(text);
  if (percent) score += 2 + Math.min(10, Math.floor(percent / 5));

  if (FREE_KEYWORDS.some((keyword) => content.includes(keyword))) score += 3;
  if (DEAL_KEYWORDS.some((keyword) => content.includes(keyword))) score += 1;

  if (
    content.includes("all-time low") ||
    content.includes("record low") ||
    content.includes("price error") ||
    content.includes("price mistake")
  ) {
    score += 4;
  }

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

  const trailingDealBits = working.match(
    /\s+(?:with|after|when|w\/)\s+(?:prime|coupon|clip coupon|promo code|code|free shipping|shipping)\b.*$/i
  );
  if (trailingDealBits) {
    extras.push(trailingDealBits[0].trim());
    working = working.replace(trailingDealBits[0], "");
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
  if (looksBrokenTitle(normalized)) {
    const fallback = extractTitleFromDescription(cleanedDescription);
    if (fallback) {
      normalized = fallback;
    }
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
  const explicit = extractDiscountPercent(text);
  if (explicit) return explicit;
  const wasNow = extractWasNowPrices(text);
  if (wasNow) {
    const percent = Math.round(((wasNow.original - wasNow.current) / wasNow.original) * 100);
    if (Number.isFinite(percent) && percent >= 5 && percent < 100) return percent;
  }
  return null;
}

function extractWasNowPrices(text: string): { original: number; current: number } | null {
  if (!text) return null;
  const patterns: RegExp[] = [
    /was\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:now|for|only)?\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /down\s+from\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:to|now|for)?\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /from\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:to|down to|now)?\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /list\s+price\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?).*?\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /msrp\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?).*?\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const original = Number(match[1].replace(/[^0-9.]/g, ""));
    const current = Number(match[2].replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(original) || !Number.isFinite(current)) continue;
    if (original > current && original > 0 && current > 0) {
      return { original, current };
    }
  }
  return null;
}

function extractCurrentPrice(text: string): number | null {
  return extractBestPriceValue(text);
}

function extractDiscountPercent(text: string): number | null {
  if (!text) return null;

  const patterns: RegExp[] = [
    /(\d{1,2})\s?%\s*(?:off|discount|savings)\b/i,
    /save\s*(\d{1,2})\s?%\b/i,
    /(\d{1,2})\s?%\s*deal\b/i,
    /(\d{1,2})\s?%\s*price\s*drop\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) continue;
    if (value >= 5 && value < 100) return value;
  }
  return null;
}

function extractBestPriceValue(text: string): number | null {
  if (!text) return null;

  const wasNow = extractWasNowPrices(text);
  if (wasNow) return wasNow.current;

  const contextualPatterns: RegExp[] = [
    /(?:now|for|only|just|at|down to|as low as|sale price|deal price|price)\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /(?:after coupon|with coupon|clip coupon)\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
  ];
  for (const pattern of contextualPatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1].replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }

  const candidates = extractPriceCandidates(text);
  if (!candidates.length) return null;
  return Math.min(...candidates);
}

function extractPriceCandidates(text: string): number[] {
  const candidates: number[] = [];
  if (!text) return candidates;
  const lower = text.toLowerCase();
  const regex = /\$\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g;
  for (const match of lower.matchAll(regex)) {
    const value = Number(match[1].replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(value) || value <= 0) continue;
    const index = match.index ?? 0;
    const before = lower.slice(Math.max(0, index - 16), index);
    if (/(save|off|coupon|discount|rebate|credit|cashback|list|msrp)/.test(before)) {
      continue;
    }
    candidates.push(value);
  }
  return candidates;
}

function formatPriceValue(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const cents = Math.round(rounded * 100) % 100;
  const formatted = cents === 0 ? rounded.toFixed(0) : rounded.toFixed(2);
  return `$${formatted}`;
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

function looksBrokenTitle(value: string): boolean {
  if (!value) return true;
  const cleaned = value.trim();
  if (cleaned.length < 6) return true;
  if (/^[\d\W]+$/.test(cleaned)) return true;
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length < 2;
}

function extractTitleFromDescription(description: string): string | null {
  if (!description) return null;
  let text = description;
  text = text.replace(/^amazon(?:\.com)?\s+has\s+(?:the\s+)?/i, "");
  text = text.replace(/^new price low\s*[:\\-]?\s*/i, "");
  text = text.replace(/^deal alert\s*[:\\-]?\s*/i, "");
  text = text.replace(/^limited time deal\s*[:\\-]?\s*/i, "");
  text = text.replace(/\bfor\s+\$[0-9].*$/i, "");
  text = text.replace(/\bnow\s+\$[0-9].*$/i, "");
  text = text.replace(/\bdown to\s+\$[0-9].*$/i, "");
  text = text.replace(/\bwith free shipping.*$/i, "");
  text = text.replace(/\bon amazon(?:\.com)?\b.*$/i, "");
  text = text.replace(/\b(?:was|list price|msrp)\b.*$/i, "");

  const sentence = text.split(/\\.|\\n|\\r/)[0] || text;
  const cleaned = normalizeWhitespace(sentence);
  if (!cleaned) return null;
  if (cleaned.length > 90) {
    return cleaned.slice(0, 90).trim();
  }
  return cleaned;
}
