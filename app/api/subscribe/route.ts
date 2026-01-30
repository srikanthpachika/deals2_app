import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();
    const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalized || !EMAIL_REGEX.test(normalized)) {
      return new NextResponse("Invalid email", { status: 400 });
    }

    await prisma.subscriber.upsert({
      where: { email: normalized },
      update: {},
      create: {
        email: normalized,
        source: typeof source === "string" ? source : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
}
