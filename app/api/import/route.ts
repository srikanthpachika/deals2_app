import { NextResponse } from 'next/server';
import { scrapeOG } from '@/utils/scrape';

export async function POST(req: Request) {
  const token = req.headers.get('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) return new NextResponse('Forbidden', { status: 403 });
  const { url } = await req.json();
  if (!url) return new NextResponse('Bad Request', { status: 400 });
  const data = await scrapeOG(url);
  return NextResponse.json(data);
}
