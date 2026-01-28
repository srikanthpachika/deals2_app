import { prisma } from "@/lib/prisma";
import {
  normalizeAmazonProductUrl,
  normalizeDealDescription,
  normalizeDealTitle,
  withAmazonAffiliateTag,
} from "@/lib/dealFilters";
import { getDealCreatedAtCutoff } from "@/lib/dealExpiry";
import { getDealCategory } from "@/lib/dealCategories";
import AdSlot from "@/components/AdSlot";
import Link from "next/link";

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await prisma.deal.findUnique({
    where: { id: Number(params.id) },
  });

  const now = new Date();
  const cutoff = getDealCreatedAtCutoff(now);
  const expired = deal
    ? deal.createdAt < cutoff && (!deal.expiresAt || deal.expiresAt <= now)
    : true;

  if (!deal || expired || !normalizeAmazonProductUrl(deal.url)) {
    return (
      <div className="page">
        <div className="card empty-state">
          <h3 className="card__title">Deal not found</h3>
          <p className="muted">
            This deal may have expired or been removed.
          </p>
          <div className="form-actions">
            <Link href="/" className="btn btn--primary">
              Back to deals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const normalized = normalizeDealTitle(deal.title, deal.description);
  const displayDescription = normalizeDealDescription(
    deal.description,
    normalized.extras
  );
  const affiliateUrl = withAmazonAffiliateTag(deal.url);
  const category = getDealCategory(normalized.title, displayDescription);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link href="/" className="link-back">
            Back to deals
          </Link>
          <h1 className="page-title">{normalized.title}</h1>
          {deal.source ? (
            <p className="page-subtitle">Source: {deal.source}</p>
          ) : null}
        </div>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--primary"
        >
          Buy on Amazon
        </a>
      </header>

      <section className="deal-detail">
        <div className="deal-detail__media">
          {deal.image ? (
            <img src={deal.image} alt={normalized.title} />
          ) : (
            <div className="deal-card__placeholder">No image</div>
          )}
        </div>
        <div className="deal-detail__content">
          <p className="lead">
            {displayDescription || "No description provided yet."}
          </p>
          <div className="deal-detail__meta">
            <span
              className="tag tag--category"
              data-category={category.id}
            >
              {category.label}
            </span>
            {normalized.percentOff !== null ? (
              <span className="tag tag--percent">{normalized.percentOff}% off</span>
            ) : null}
            {deal.price ? <span className="tag tag--price">{deal.price}</span> : null}
            {deal.source ? <span className="tag">{deal.source}</span> : null}
          </div>
          <div className="form-actions">
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              Buy on Amazon
            </a>
            <Link href="/" className="btn btn--ghost">
              More deals
            </Link>
          </div>
        </div>
      </section>

      <div className="ad-frame">
        <AdSlot slot="1234567890" />
      </div>
    </div>
  );
}
