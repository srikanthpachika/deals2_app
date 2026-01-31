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
  percentSource?: "structured" | "text" | null;
  percentComputed?: number | null;
  prices?: { list: number | null; current: number | null } | null;
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

  if (!image) {
    const dynamicImage = root
      .querySelector("img[data-a-dynamic-image]")
      ?.getAttribute("data-a-dynamic-image");
    if (dynamicImage) {
      try {
        const parsed = JSON.parse(dynamicImage);
        const first = Object.keys(parsed)[0];
        if (first) image = first;
      } catch {
        // ignore JSON parse errors
      }
    }
  }

  if (!image) {
    const extracted = extractAmazonImage(html);
    if (extracted) image = extracted;
  }

  if (!image && url.includes("amazon.com")) {
    const jinaImage = await extractAmazonImageFromJina(url, Math.min(8000, timeoutMs));
    if (jinaImage) image = jinaImage;
  }

  if (image) image = absolutize(image, url);

  let price = meta("product:price:amount") || "";

  const siteName = meta("og:site_name") || safeSiteName(url);

  const prices = extractAmazonPrices(html);
  const explicitPercent = extractAmazonExplicitPercent(html);
  const percentOff = explicitPercent?.value ?? null;
  const percentSource = explicitPercent?.source ?? null;
  const percentComputed =
    prices?.list && prices.current
      ? Math.round(((prices.list - prices.current) / prices.list) * 100)
      : null;
  if (prices?.current) {
    price = formatPriceValue(prices.current);
  } else if (!price && prices?.list) {
    price = formatPriceValue(prices.list);
  } else if (price && !price.startsWith("$")) {
    const parsed = Number(price);
    if (Number.isFinite(parsed)) price = formatPriceValue(parsed);
  }

  return {
    title,
    description,
    image,
    price,
    siteName,
    percentOff,
    percentSource,
    percentComputed,
    prices: prices ?? null,
  };
}

function extractAmazonExplicitPercent(
  html: string
): { value: number; source: "structured" | "text" } | null {
  const structuredPatterns: RegExp[] = [
    /"savingsPercentage"\s*:\s*"?(\d{1,2})"?/i,
    /"savingPercent"\s*:\s*"?(\d{1,2})"?/i,
  ];

  for (const pattern of structuredPatterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 5 && value < 100) {
      return { value, source: "structured" };
    }
  }

  const textPatterns: RegExp[] = [
    /(\d{1,2})\s?%\s*off/i,
    /Save\s*(\d{1,2})\s?%/i,
  ];

  for (const pattern of textPatterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 5 && value < 100) {
      return { value, source: "text" };
    }
  }

  return null;
}

function extractAmazonPrices(html: string): { list: number | null; current: number | null } | null {
  const listPatterns: RegExp[] = [
    /"listPrice"\s*:\s*\{[^}]*"amount"\s*:\s*"?(\d+\.?\d*)"?/i,
    /"listPrice"\s*:\s*\{[^}]*"value"\s*:\s*"?(\d+\.?\d*)"?/i,
    /List Price:\s*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /priceblock_strikeprice[^\$]*\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
  ];
  const currentPatterns: RegExp[] = [
    /"priceToPay"\s*:\s*\{"displayPrice"\s*:\s*"\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)"/i,
    /"priceToPay"\s*:\s*\{[^}]*"value"\s*:\s*"?(\d+\.?\d*)"?/i,
    /"priceToPay"\s*:\s*\{[^}]*"amount"\s*:\s*"?(\d+\.?\d*)"?/i,
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

function formatPriceValue(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const cents = Math.round(rounded * 100) % 100;
  const formatted = cents === 0 ? rounded.toFixed(0) : rounded.toFixed(2);
  return `$${formatted}`;
}

function extractAmazonImage(html: string): string | null {
  const patterns: RegExp[] = [
    /"hiRes"\s*:\s*"([^"]+)"/i,
    /"large"\s*:\s*"([^"]+)"/i,
    /"main"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const decoded = decodeJsonString(match[1]);
    if (decoded) return decoded;
  }
  return null;
}

function decodeJsonString(value: string): string {
  return value
    .replace(/\\u002F/g, "/")
    .replace(/\\u003A/g, ":")
    .replace(/\\u003D/g, "=")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003F/g, "?")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, "\"");
}

async function extractAmazonImageFromJina(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
    const res = await fetch(jinaUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    const text = await res.text();
    const matches = text.match(/https?:\/\/m\.media-amazon\.com\/images\/I\/[^\s\]]+/gi);
    if (!matches || !matches.length) return null;
    const cleaned = matches.map((entry) => entry.replace(/[),]+$/, ""));
    const filtered = cleaned.filter(
      (entry) => !/(sprite|icon|logo|prime|favicon)/i.test(entry)
    );
    const candidates = filtered.length ? filtered : cleaned;
    const preferred =
      candidates.find((entry) => /_AC_|_SL\d+_|_SX\d+_/i.test(entry)) ||
      candidates[0];
    return preferred || null;
  } catch {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
