import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DealCard from "@/components/DealCard";

export const revalidate = 600;

export default async function BestAmazonDealsThisWeek() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const deals = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
      createdAt: { gte: weekAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Article</p>
          <h1 className="page-title">Best Amazon Deals This Week (Updated Daily)</h1>
          <p className="page-subtitle">
            The newest Amazon discounts we've seen in the last 7 days. Refreshes
            throughout the day as fresh drops land.
          </p>
        </div>
        <Link href="/articles" className="btn btn--ghost">
          Back to articles
        </Link>
      </header>

      {deals.length === 0 ? (
        <div className="card empty-state">
          <h4 className="card__title">No weekly deals yet</h4>
          <p className="muted">Check back soon or add a deal from the admin page.</p>
        </div>
      ) : (
        <div className="deal-grid deal-grid--featured">
          {deals.map((deal, index) => (
            <DealCard
              key={deal.id}
              deal={{
                ...deal,
                createdAt: deal.createdAt.toISOString(),
              }}
              index={index}
              variant="compact"
            />
          ))}
        </div>
      )}
    </div>
  );
}
