import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const token = req.headers.get('x-admin-token');
  if (token && token === process.env.ADMIN_TOKEN) return NextResponse.json({ ok: true });
  return new NextResponse('Forbidden', { status: 403 });
}
