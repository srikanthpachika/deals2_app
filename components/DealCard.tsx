import Image from "next/image";
import Link from "next/link";
import {
  getDisplayPrice,
  normalizeDealDescription,
  normalizeDealTitle,
  withAmazonAffiliateTag,
} from "@/lib/dealFilters";

export interface DealProps {
  id: number;
  title: string;
  url: string;
  image?: string | null;
  price?: string | null;
  percentOff?: number | null;
  source?: string | null;
  description?: string | null;
  createdAt: string;
  categoryId?: string;
  categoryLabel?: string;
}

export default function DealCard({
  deal,
  index = 0,
  variant = "default",
}: {
  deal: DealProps;
  index?: number;
  variant?: "default" | "compact";
}) {
  const delay = Math.min(index, 8) * 70;
  const cardClassName =
    variant === "compact" ? "deal-card deal-card--compact" : "deal-card";
  const normalized = normalizeDealTitle(deal.title, deal.description);
  const displayDescription = normalizeDealDescription(
    deal.description,
    normalized.extras
  );
  const displayPrice = getDisplayPrice(deal.title, deal.description, deal.price);
  const displayPercent = deal.percentOff ?? null;
  const displayTitle = displayPercent
    ? `${normalized.title} - ${displayPercent}% off`
    : normalized.title;
  const affiliateUrl = withAmazonAffiliateTag(deal.url);

  return (
    <article
      className={cardClassName}
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
    >
      <div className="deal-card__media">
        {deal.image ? (
          <Image
            src={deal.image}
            alt={normalized.title}
            fill
            sizes="(max-width: 720px) 100vw, 140px"
            className="deal-card__image"
          />
        ) : (
          <div className="deal-card__placeholder">No image</div>
        )}
      </div>
      <div className="deal-card__content">
        <h3 className="deal-card__title">
          <Link href={`/deal/${deal.id}`}>{displayTitle}</Link>
        </h3>
        {displayDescription ? (
          <p className="deal-card__desc">{displayDescription}</p>
        ) : (
          <p className="deal-card__desc muted">No description yet.</p>
        )}
        <div className="deal-card__meta">
          {displayPercent !== null && displayPercent !== undefined ? (
            <span className="tag tag--percent">{displayPercent}% off</span>
          ) : null}
          {displayPrice ? (
            <span className="tag tag--price">{displayPrice}</span>
          ) : null}
          {deal.categoryLabel ? (
            <span
              className="tag tag--category"
              data-category={deal.categoryId || "other"}
            >
              {deal.categoryLabel}
            </span>
          ) : null}
          {deal.source ? <span className="tag">{deal.source}</span> : null}
        </div>
        <div className="deal-card__footer">
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
          >
            View on Amazon
          </a>
          <Link
            href={`/deal/${deal.id}`}
            className={variant === "compact" ? "btn btn--link" : "btn btn--ghost"}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
