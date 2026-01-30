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
    const displayPercent = item.percentOff ?? null;
    return {
      ...item,
      title: normalized.title,
      description,
      price: displayPrice,
      percentOff: displayPercent,
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
        percentOff: null,
        approved: true,
        expiresAt: getDealExpiresAt(),
      }
    });
    return NextResponse.json(created);
  } catch (e) {
    return new NextResponse('Not saved', { status: 400 });
  }
}
