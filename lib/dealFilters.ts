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

export function normalizeTitle(title: string): string {
  return normalizeWhitespace(title);
}

export function trimText(text: string, max = 240): string {
  const cleaned = normalizeWhitespace(text);
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

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
