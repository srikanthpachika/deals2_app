import { parse } from "node-html-parser";

export type FeedItem = {
  title: string;
  url: string;
  description?: string;
  publishedAt?: Date;
};

type FetchOptions = {
  timeoutMs?: number;
  userAgent?: string;
};

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function fetchFeed(
  url: string,
  options: FetchOptions = {}
): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": options.userAgent ?? DEFAULT_USER_AGENT,
        "accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Feed request failed (${res.status})`);
    }

    const xml = await res.text();
    return parseFeed(xml);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function parseFeed(xml: string): FeedItem[] {
  const root = parse(xml, { lowerCaseTagName: false, comment: false });
  const items = root.querySelectorAll("item");

  if (items.length) {
    return items
      .map((item) => toRssItem(item))
      .filter((item) => item.url && item.title);
  }

  const entries = root.querySelectorAll("entry");
  if (entries.length) {
    return entries
      .map((entry) => toAtomEntry(entry))
      .filter((entry) => entry.url && entry.title);
  }

  return [];
}

function toRssItem(item: any): FeedItem {
  const title = normalizeWhitespace(textContent(item, "title"));
  const description = normalizeWhitespace(
    stripHtml(
      textContent(item, "content\\:encoded") ||
        textContent(item, "description")
    )
  );
  const url = normalizeWhitespace(
    linkFromTag(item) || textContent(item, "guid")
  );
  const publishedAt = parseDate(
    textContent(item, "pubDate") || textContent(item, "dc\\:date")
  );

  return { title, url, description, publishedAt };
}

function toAtomEntry(entry: any): FeedItem {
  const title = normalizeWhitespace(textContent(entry, "title"));
  const description = normalizeWhitespace(
    stripHtml(textContent(entry, "summary") || textContent(entry, "content"))
  );
  const url = normalizeWhitespace(linkFromTag(entry));
  const publishedAt = parseDate(
    textContent(entry, "updated") || textContent(entry, "published")
  );

  return { title, url, description, publishedAt };
}

function linkFromTag(node: any): string {
  const alternate = node.querySelector('link[rel="alternate"]');
  const link = alternate || node.querySelector("link");
  const href = link?.getAttribute?.("href");
  if (href) return href.trim();
  const text = link?.text;
  if (text) return text.trim();
  return "";
}

function textContent(node: any, selector: string): string {
  return node.querySelector(selector)?.text?.trim() || "";
}

function stripHtml(value: string): string {
  if (!value) return "";
  return parse(value).text.trim();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return undefined;
  return parsed;
}
