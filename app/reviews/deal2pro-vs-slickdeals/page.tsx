import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DealCard from "@/components/DealCard";

export const revalidate = 600;

const COMPARISON_ROWS = [
  {
    label: "Title clarity",
    deal2pro: "Clean product name + % off (when explicit).",
    slickdeals: "Community titles vary by post.",
  },
  {
    label: "Retailer focus",
    deal2pro: "Amazon-only feed for faster decisions.",
    slickdeals: "Multi-retailer mix across the community.",
  },
  {
    label: "Direct checkout",
    deal2pro: "Direct Amazon product link.",
    slickdeals: "Link destination varies by post.",
  },
  {
    label: "Noise level",
    deal2pro: "Filtered feed with fewer duplicates.",
    slickdeals: "Large volume and duplicates are common.",
  },
];

export default async function Deal2ProVsSlickdeals() {
  const deals = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Review</p>
          <h1 className="page-title">Deal2Pro vs Slickdeals - What's Different?</h1>
          <p className="page-subtitle">
            A straight, practical comparison of clarity and speed to checkout.
          </p>
        </div>
        <Link href="/reviews" className="btn btn--ghost">
          Back to reviews
        </Link>
      </header>

      <section className="content-section">
        <h2 className="section-title">High-level comparison</h2>
        <div className="compare-table">
          <div className="compare-table__row compare-table__head">
            <div>Category</div>
            <div>Deal2Pro</div>
            <div>Slickdeals</div>
          </div>
          {COMPARISON_ROWS.map((row) => (
            <div key={row.label} className="compare-table__row">
              <div className="compare-table__label">{row.label}</div>
              <div>{row.deal2pro}</div>
              <div>{row.slickdeals}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <h2 className="section-title">Example product comparisons</h2>
        <p className="section-subtitle">
          For each product below, Deal2Pro keeps the title clean, the link direct,
          and the Amazon-only context obvious.
        </p>
        {deals.length === 0 ? (
          <div className="card empty-state">
            <h4 className="card__title">No deals to compare yet</h4>
            <p className="muted">Add deals first to populate comparisons.</p>
          </div>
        ) : (
          <div className="content-stack">
            {deals.map((deal, index) => (
              <div key={deal.id} className="compare-block">
                <DealCard
                  deal={{ ...deal, createdAt: deal.createdAt.toISOString() }}
                  index={index}
                  variant="compact"
                />
                <div className="compare-table compare-table--mini">
                  {COMPARISON_ROWS.map((row) => (
                    <div key={`${deal.id}-${row.label}`} className="compare-table__row">
                      <div className="compare-table__label">{row.label}</div>
                      <div>{row.deal2pro}</div>
                      <div>{row.slickdeals}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="content-section">
        <p className="section-subtitle">
          Note: Slickdeals is a third-party platform. The comparison above reflects
          typical differences in experience and may vary by individual post.
        </p>
      </section>
    </div>
  );
}
