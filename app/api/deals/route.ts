import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getDisplayPrice,
  normalizeAmazonProductUrl,
  normalizeDealDescription,
  normalizeDealTitle,
  withAmazonAffiliateTag,
} from '@/lib/dealFilters';
import { getDealCreatedAtCutoff, getDealExpiresAt } from '@/lib/dealExpiry';
import { maybeIngestFeeds } from '@/lib/autoIngest';
import { getDailyLimit } from '@/lib/ingestConfig';
import { scrapeOG } from '@/utils/scrape';
import { getPercentMatchTolerance } from '@/lib/percentModel';

function isToday(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export async function GET() {
  await maybeIngestFeeds();
  const now = new Date();
  const cutoff = getDealCreatedAtCutoff(now);
  const items = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: 'https://www.amazon.com/dp/' },
      percentVerified: true,
      percentOff: { not: null },
      OR: [
        { expiresAt: { gt: now } },
        { createdAt: { gte: cutoff } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  const payload = items.map((item) => {
    const normalized = normalizeDealTitle(item.title, item.description);
    const description = normalizeDealDescription(item.description, normalized.extras);
    const displayPrice = getDisplayPrice(item.title, item.description, item.price);
    const displayPercent = item.percentVerified ? item.percentOff ?? null : null;
    return {
      ...item,
      title: normalized.title,
      description,
      price: displayPrice,
      percentOff: displayPercent,
      percentVerified: item.percentVerified ?? false,
      url: withAmazonAffiliateTag(item.url),
    };
  });
  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const token = req.headers.get('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) return new NextResponse('Forbidden', { status: 403 });

  const { title, url, price, image, description, source } = await req.json();
  const normalizedUrl = normalizeAmazonProductUrl(url);
  if (!normalizedUrl) return new NextResponse('Amazon product URL required', { status: 400 });
  const normalized = normalizeDealTitle(title, description);
  const normalizedDescription = normalizeDealDescription(description, normalized.extras);
  const displayPrice = getDisplayPrice(title, description, price);
  let percentOff: number | null = null;
  let percentVerified = false;

  try {
    const scraped = await scrapeOG(normalizedUrl);
    const explicitPercent =
      scraped.percentOff && scraped.percentOff > 0 && scraped.percentOff < 100
        ? scraped.percentOff
        : null;
    const computedPercent =
      scraped.percentComputed &&
      scraped.percentComputed > 0 &&
      scraped.percentComputed < 100
        ? scraped.percentComputed
        : null;
    const tolerance = getPercentMatchTolerance();
    if (
      explicitPercent !== null &&
      computedPercent !== null &&
      Math.abs(explicitPercent - computedPercent) <= tolerance
    ) {
      percentOff = computedPercent;
      percentVerified = true;
    }
  } catch {
    // ignore scrape failures for admin saves
  }

  // Enforce < 50 deals per day
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const countToday = await prisma.deal.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      url: { startsWith: 'https://www.amazon.com/dp/' },
    },
  });
  const dailyLimit = getDailyLimit();
  if (dailyLimit !== null && countToday >= dailyLimit) {
    return new NextResponse('Daily limit reached', { status: 409 });
  }

  try {
    const created = await prisma.deal.create({
      data: {
        title: normalized.title,
        url: normalizedUrl,
        price: displayPrice,
        image,
        description: normalizedDescription || null,
        source: source || 'amazon.com',
        percentOff,
        percentVerified,
        approved: true,
        expiresAt: getDealExpiresAt(),
      }
    });
    return NextResponse.json(created);
  } catch (e) {
    return new NextResponse('Not saved', { status: 400 });
  }
}
