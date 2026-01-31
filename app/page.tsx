import { prisma } from "@/lib/prisma";
import AdSlot from "@/components/AdSlot";
import DealCard from "@/components/DealCard";
import Link from "next/link";
import { getDealCreatedAtCutoff } from "@/lib/dealExpiry";
import { maybeIngestFeeds } from "@/lib/autoIngest";
import { DEAL_CATEGORIES, getDealCategory } from "@/lib/dealCategories";
import {
  normalizeDealDescription,
  normalizeDealTitle,
} from "@/lib/dealFilters";
import NewsletterForm from "@/components/NewsletterForm";
import StickyHeaderController from "@/components/StickyHeaderController";
import DealFeed from "@/components/DealFeed";
import ScrollResume from "@/components/ScrollResume";
import Image from "next/image";

export const revalidate = 600;

const MAX_DEALS = 1000;
const CATEGORY_DEALS_LIMIT = 40;

export default async function Home() {
  await maybeIngestFeeds();
  const now = new Date();
  const cutoff = getDealCreatedAtCutoff(now);
  const deals = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
      image: { not: null },
      price: { not: null },
      NOT: { price: "" },
      OR: [
        { expiresAt: { gt: now } },
        { createdAt: { gte: cutoff } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: MAX_DEALS,
  });

  const dealsWithCategory = deals.map((deal) => {
    const normalized = normalizeDealTitle(deal.title, deal.description);
    const description = normalizeDealDescription(deal.description, normalized.extras);
    const category = getDealCategory(normalized.title, description);
    return {
      id: deal.id,
      title: normalized.title,
      url: deal.url,
      image: deal.image,
      price: deal.price,
      source: deal.source,
      description,
      percentOff: deal.percentOff ?? null,
      percentVerified: deal.percentVerified ?? false,
      createdAt: deal.createdAt.toISOString(),
      categoryId: category.id,
      categoryLabel: category.label,
    };
  });

  const categorySections = DEAL_CATEGORIES.filter(
    (category) => category.id !== "other"
  ).map((category) => ({
    ...category,
    deals: dealsWithCategory.filter((deal) => deal.categoryId === category.id),
  }));

  const activeCategories = categorySections.filter(
    (section) => section.deals.length > 0
  );
  const otherSection = {
    ...DEAL_CATEGORIES.find((category) => category.id === "other")!,
    deals: dealsWithCategory.filter((deal) => deal.categoryId === "other"),
  };

  const dealsCount = dealsWithCategory.length;
  const categoryCount = activeCategories.length;
  const latestDealAt = deals[0]?.createdAt;
  const latestLabel = latestDealAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
        timeZoneName: "short",
      }).format(latestDealAt)
    : "No recent updates";
  const cadenceMinutes = Number(process.env.INGEST_INTERVAL_MINUTES || "10");
  const cadenceLabel = Number.isFinite(cadenceMinutes)
    ? `${Math.max(1, cadenceMinutes)} min`
    : "hourly";
  const featuredDeals = dealsWithCategory.slice(0, 12);

  return (
    <div className="page">
      <StickyHeaderController />
      <ScrollResume />
      <div className="top-shell">
        <header className="site-header">
          <div className="brand">
            <div className="brand__mark">D2P</div>
            <div>
              <p className="eyebrow">Curated daily drops</p>
              <h1 className="brand__title">Deal2Pro</h1>
              <p className="brand__tagline">
                A calmer way to browse Amazon deals.
              </p>
            </div>
          </div>
          <nav className="nav">
            <a href="#category-sections" className="btn btn--soft">
              Categories
            </a>
            <span className="chip chip--live">{dealsCount} live</span>
          </nav>
        </header>

        <nav className="category-nav category-nav--top" aria-label="Deal categories">
          <a className="category-chip" href="#all-deals">
            All deals
            <span>{dealsCount}</span>
          </a>
          {activeCategories.map((section) => (
            <a key={section.id} className="category-chip" href={`#${section.id}`}>
              {section.label}
              <span>{section.deals.length}</span>
            </a>
          ))}
          {otherSection.deals.length > 0 ? (
            <a className="category-chip" href="#more-deals">
              {otherSection.label}
              <span>{otherSection.deals.length}</span>
            </a>
          ) : null}
        </nav>
      </div>

      <section id="all-deals" className="collection-section collection-section--top">
        <div className="all-deals-layout">
          <div className="all-deals-main">
            <div className="section-header">
              <div>
                <h3 className="section-title">All deals</h3>
                <p className="section-subtitle">
                  The full feed, refreshed constantly, newest first.
                </p>
              </div>
              <div className="section-actions">
                <span className="chip">{dealsCount} live</span>
              </div>
            </div>

            {dealsCount === 0 ? (
              <div className="card empty-state">
                <h4 className="card__title">Nothing live yet</h4>
                <p className="muted">
                  Check back soon or add the first deal from the admin page.
                </p>
                <div className="form-actions">
                  <Link href="/admin" className="btn btn--primary">
                    Add a deal
                  </Link>
                </div>
              </div>
            ) : (
              <DealFeed
                deals={dealsWithCategory}
                cadenceMinutes={cadenceMinutes}
              />
            )}
          </div>
          <aside className="all-deals-aside">
            <div className="panel-card panel-card--newsletter panel-card--compact">
              <p className="eyebrow">Stay in the loop</p>
              <h3 className="panel-title">Get the best drops first</h3>
              <p className="panel-subtitle">
                A calm, curated feed of new Amazon discounts, delivered in minutes.
              </p>
              <NewsletterForm />
              <p className="micro">No spam. Unsubscribe anytime.</p>
            </div>
            <div className="panel-card panel-card--stats panel-card--compact">
              <div className="stat">
                <span className="stat__label">Live deals</span>
                <span className="stat__value">{dealsCount}</span>
              </div>
              <div className="stat">
                <span className="stat__label">Categories live</span>
                <span className="stat__value">{categoryCount}</span>
              </div>
              <div className="stat">
                <span className="stat__label">Latest refresh</span>
                <span className="stat__value">{latestLabel}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="hero hero--full hero--secondary">
        <div className="hero__copy">
          <p className="eyebrow">Live drops</p>
          <h2>
            A clean, spacious library of Amazon price drops for easy browsing.
          </h2>
          <p className="lead">
            We scan multiple sources, normalize Amazon links, and keep the feed
            calm, fresh, and neatly categorized.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#all-deals">
              Browse all deals
            </a>
            <a className="btn btn--soft" href="#category-sections">
              Explore categories
            </a>
            <span className="pill">Refreshes every {cadenceLabel}</span>
          </div>
          {featuredDeals.length ? (
            <div className="hero-featured">
              <div className="hero-featured__header">
                <p className="eyebrow">Featured now</p>
                <a className="btn btn--link" href="#all-deals">
                  View all
                </a>
              </div>
              <div className="hero-featured__grid">
                {featuredDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    className="featured-card"
                    href={`/deal/${deal.id}`}
                  >
                    <div className="featured-card__media">
                      {deal.image ? (
                        <Image
                          src={deal.image}
                          alt={deal.title}
                          fill
                          sizes="(max-width: 720px) 45vw, 120px"
                          className="featured-card__image"
                        />
                      ) : (
                        <div className="deal-card__placeholder">No image</div>
                      )}
                    </div>
                    <div className="featured-card__body">
                      <span className="featured-card__title">{deal.title}</span>
                      <div className="featured-card__meta">
                        {deal.percentVerified && deal.percentOff ? (
                          <span className="tag tag--percent tag--tight">
                            {deal.percentOff}% off
                          </span>
                        ) : null}
                        {deal.price ? (
                          <span className="tag tag--price tag--tight">
                            {deal.price}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        
      </section>

      {process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
        <div className="ad-frame">
          <AdSlot slot="TOP_BANNER_SLOT_ID" />
        </div>
      ) : null}

      <div id="category-sections" className="category-anchor" />

      {activeCategories.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="category-section"
        >
          <div className="section-header">
            <div>
              <h3 className="section-title">{section.label}</h3>
              <p className="section-subtitle">{section.description}</p>
            </div>
            <div className="section-actions">
              <span className="chip">{section.deals.length} live</span>
              <a className="btn btn--link" href="#all-deals">
                View full feed
              </a>
            </div>
          </div>
          <div className="deal-grid">
            {section.deals.slice(0, CATEGORY_DEALS_LIMIT).map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                variant="compact"
              />
            ))}
          </div>
        </section>
      ))}

      {otherSection.deals.length > 0 ? (
        <section id="more-deals" className="category-section">
          <div className="section-header">
            <div>
              <h3 className="section-title">{otherSection.label}</h3>
              <p className="section-subtitle">{otherSection.description}</p>
            </div>
            <div className="section-actions">
              <span className="chip">{otherSection.deals.length} live</span>
              <a className="btn btn--link" href="#all-deals">
                View full feed
              </a>
            </div>
          </div>
          <div className="deal-grid">
            {otherSection.deals.slice(0, CATEGORY_DEALS_LIMIT).map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                variant="compact"
              />
            ))}
          </div>
        </section>
      ) : null}

      {process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
        <div className="ad-frame">
          <AdSlot slot="8909564330" />
        </div>
      ) : null}
    </div>
  );
}
