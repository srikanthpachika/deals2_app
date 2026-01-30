import { parse } from "node-html-parser";

type ScrapeOptions = {
  timeoutMs?: number;
};

function absolutize(src: string, baseUrl: string) {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return src;
  }
}

function safeSiteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

type ScrapeResult = {
  title: string;
  description: string;
  image: string;
  price: string;
  siteName: string;
  percentOff?: number | null;
};

export async function scrapeOG(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        // Many retailers (incl. Amazon) change output based on UA & accept
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      // Don't follow too many redirects
      redirect: "follow",
      signal: controller.signal,
    });

    html = await res.text();
  } catch {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      title: url,
      description: "",
      image: "",
      price: "",
      siteName: safeSiteName(url),
      percentOff: null,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (!html) {
    return {
      title: url,
      description: "",
      image: "",
      price: "",
      siteName: safeSiteName(url),
      percentOff: null,
    };
  }

  const root = parse(html);

  const meta = (prop: string) =>
    root.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") ||
    root.querySelector(`meta[name="${prop}"]`)?.getAttribute("content");

  // Title / description
  const title =
    meta("og:title") || root.querySelector("title")?.text?.trim() || url;

  const description = meta("og:description") || meta("description") || "";

  // Try multiple image locations
  let image =
    meta("og:image") ||
    meta("og:image:secure_url") ||
    meta("twitter:image") ||
    root.querySelector('link[rel="image_src"]')?.getAttribute("href") ||
    root.querySelector("#landingImage")?.getAttribute("data-old-hires") ||
    root.querySelector("#landingImage")?.getAttribute("src") ||
    root.querySelector("img[data-a-dynamic-image]")?.getAttribute("src") ||
    "";

  if (image) image = absolutize(image, url);

  const price = meta("product:price:amount") || "";

  const siteName = meta("og:site_name") || safeSiteName(url);

  const percentOff = extractAmazonPercentOff(html);

  return { title, description, image, price, siteName, percentOff };
}

function extractAmazonPercentOff(html: string): number | null {
  const patterns: RegExp[] = [
    /"savingsPercentage"\s*:\s*"?(\d{1,2})"?/i,
    /"savingPercent"\s*:\s*"?(-?\d{1,2})"?/i,
    /(\d{1,2})\s?%\s*off/i,
    /Save\s*(\d{1,2})\s?%/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 5 && value < 100) return value;
  }

  const prices = extractAmazonPrices(html);
  if (prices?.list && prices.current) {
    const percent = Math.round(((prices.list - prices.current) / prices.list) * 100);
    if (Number.isFinite(percent) && percent >= 5 && percent < 100) return percent;
  }

  return null;
}

function extractAmazonPrices(html: string): { list: number | null; current: number | null } | null {
  const listPatterns: RegExp[] = [
    /"listPrice"\s*:\s*\{[^}]*"amount"\s*:\s*"?(\d+\.?\d*)"?/i,
    /List Price:\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /priceblock_strikeprice[^\$]*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
  ];
  const currentPatterns: RegExp[] = [
    /"priceToPay"\s*:\s*\{"displayPrice"\s*:\s*"\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)"/i,
    /priceblock_dealprice[^\$]*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /priceblock_ourprice[^\$]*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /"price"\s*:\s*"\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)"/i,
  ];

  const list = findFirstPrice(html, listPatterns);
  const current = findFirstPrice(html, currentPatterns);

  if (!list && !current) return null;
  return { list, current };
}

function findFirstPrice(html: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const value = Number(match[1].replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}
