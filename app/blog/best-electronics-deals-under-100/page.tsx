import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DealCard from "@/components/DealCard";
import { getDealCategory } from "@/lib/dealCategories";

export const revalidate = 600;

function parsePrice(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export default async function BestElectronicsUnder100() {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const deals = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
      createdAt: { gte: monthAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const electronicsDeals = deals
    .map((deal) => ({ deal, category: getDealCategory(deal.title, deal.description) }))
    .filter(({ category }) => category.id === "electronics")
    .map(({ deal }) => ({
      ...deal,
      createdAt: deal.createdAt.toISOString(),
      numericPrice: parsePrice(deal.price),
    }))
    .filter((deal) => deal.numericPrice !== null && deal.numericPrice <= 100)
    .slice(0, 36);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Blog</p>
          <h1 className="page-title">Best Electronics Deals Under $100</h1>
          <p className="page-subtitle">
            A tight list of budget-friendly electronics with clean titles and
            clear savings.
          </p>
        </div>
        <Link href="/blog" className="btn btn--ghost">
          Back to blog
        </Link>
      </header>

      {electronicsDeals.length === 0 ? (
        <div className="card empty-state">
          <h4 className="card__title">No sub-$100 electronics yet</h4>
          <p className="muted">
            Check back soon or browse the main feed for new drops.
          </p>
          <div className="form-actions">
            <Link href="/" className="btn btn--primary">
              Browse all deals
            </Link>
          </div>
        </div>
      ) : (
        <div className="deal-grid deal-grid--featured">
          {electronicsDeals.map((deal, index) => (
            <DealCard
              key={deal.id}
              deal={deal}
              index={index}
              variant="compact"
            />
          ))}
        </div>
      )}
    </div>
  );
}
