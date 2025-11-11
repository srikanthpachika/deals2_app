import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isToday(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export async function GET() {
  const items = await prisma.deal.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const token = req.headers.get('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) return new NextResponse('Forbidden', { status: 403 });

  const { title, url, price, image, description, source } = await req.json();

  // Enforce < 50 deals per day
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const countToday = await prisma.deal.count({ where: { createdAt: { gte: today, lt: tomorrow } } });
  if (countToday >= 50) return new NextResponse('Daily limit reached', { status: 409 });

  try {
    const created = await prisma.deal.create({
      data: {
        title, url, price, image, description, source,
        approved: true,
      }
    });
    return NextResponse.json(created);
  } catch (e) {
    return new NextResponse('Not saved', { status: 400 });
  }
}
