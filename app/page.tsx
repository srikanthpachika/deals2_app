import { prisma } from '@/lib/prisma';
import DealCard from '@/components/DealCard';
import AdSlot from '@/components/AdSlot';
import BottomStickyAd from '@/components/ads/BottomStickyAd';
import Link from 'next/link';
import { Fragment } from 'react';

export const revalidate = 60;

export default async function Home() {
  const deals = await prisma.deal.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* === Top site header === */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Deals2Beat
        </h1>
        <nav>
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Admin
          </Link>
        </nav>
      </header>

      {/* === Top banner ad under navbar === */}
      <AdSlot slot="6474972689" />

      {/* === Main content + sidebar === */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        {/* Deals + in-feed ads */}
        <section className="space-y-4">
          {deals.length === 0 ? (
            <p>No deals yet. Check back soon!</p>
          ) : (
            deals.map((d, index) => (
              <Fragment key={d.id}>
                <DealCard
                  deal={{ ...d, createdAt: d.createdAt.toISOString() }}
                />
                {(index + 1) % 3 === 0 && (
                  <AdSlot slot="INFEED_SLOT_ID" />
                )}
              </Fragment>
            ))
          )}
        </section>

        {/* Sidebar ad (desktop only) */}
        <aside className="hidden md:block sticky top-24">
          <AdSlot slot="SIDEBAR_SLOT_ID" />
        </aside>
      </div>

      {/* Bottom banner (non-sticky) */}
      <AdSlot slot="8909564330" />

      {/* Sticky mobile ad */}
      <BottomStickyAd />
    </div>
  );
}
