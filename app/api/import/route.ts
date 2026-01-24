import { NextResponse } from 'next/server';
import { scrapeOG } from '@/utils/scrape';
import {
  normalizeAmazonProductUrl,
  normalizeDealDescription,
  normalizeDealTitle,
} from '@/lib/dealFilters';

export async function POST(req: Request) {
  const token = req.headers.get('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) return new NextResponse('Forbidden', { status: 403 });
  const { url } = await req.json();
  if (!url) return new NextResponse('Bad Request', { status: 400 });
  const normalizedUrl = normalizeAmazonProductUrl(url);
  if (!normalizedUrl) return new NextResponse('Amazon product URL required', { status: 400 });
  const data = await scrapeOG(normalizedUrl);
  const normalized = normalizeDealTitle(data.title || "", data.description || "");
  const description = normalizeDealDescription(data.description || "", normalized.extras);
  return NextResponse.json({
    ...data,
    title: normalized.title,
    description,
    url: normalizedUrl,
  });
}
