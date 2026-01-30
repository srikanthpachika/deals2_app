import { NextResponse } from "next/server";
import { ingestFeeds } from "@/lib/ingest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const report = await ingestFeeds();
  return NextResponse.json(report);
}

export async function GET(req: Request) {
  const isCron = req.headers.get("x-vercel-cron") === "1";
  const token = req.headers.get("x-admin-token");
  if (!isCron && (!token || token !== process.env.ADMIN_TOKEN)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const report = await ingestFeeds();
  return NextResponse.json(report);
}
