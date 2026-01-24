import { prisma } from "@/lib/prisma";
import DealCard from "@/components/DealCard";
import AdSlot from "@/components/AdSlot";
import Link from "next/link";
import { getDealCreatedAtCutoff } from "@/lib/dealExpiry";
import { maybeIngestFeeds } from "@/lib/autoIngest";
import { DEAL_CATEGORIES, getDealCategory } from "@/lib/dealCategories";
import { normalizeDealDescription, normalizeDealTitle } from "@/lib/dealFilters";

export const revalidate = 600;

const MAX_DEALS = 1000;
const CATEGORY_DEALS_LIMIT = 36;

export default async function Home() {
  await maybeIngestFeeds();
  const now = new Date();
  const cutoff = getDealCreatedAtCutoff(now);
  const deals = await prisma.deal.findMany({
    where: {
      approved: true,
      url: { startsWith: "https://www.amazon.com/dp/" },
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
      ...deal,
      title: normalized.title,
      description,
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

  return (
    <div className="page">
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
            <Link href="/admin" className="btn btn--ghost">
              Admin
            </Link>
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

      <section className="hero hero--full">
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
        </div>
        <div className="hero__panel">
          <div className="panel-card panel-card--newsletter">
            <p className="eyebrow">Stay in the loop</p>
            <h3 className="panel-title">Get the best drops first</h3>
            <p className="panel-subtitle">
              A calm, curated feed of new Amazon discounts, delivered in minutes.
            </p>
            <div className="panel-form">
              <label className="label" htmlFor="newsletter-email">
                Email
              </label>
              <input
                id="newsletter-email"
                className="input"
                type="email"
                placeholder="you@email.com"
              />
              <button className="btn btn--primary" type="button">
                Notify me
              </button>
            </div>
            <p className="micro">No spam. Unsubscribe anytime.</p>
          </div>
          <div className="panel-card panel-card--stats">
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
          <div className="ad-frame">
            <AdSlot slot="6474972689" />
          </div>
        </div>
      </section>

      <div className="ad-frame">
        <AdSlot slot="TOP_BANNER_SLOT_ID" />
      </div>

      <section id="all-deals" className="collection-section">
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
          <div className="deal-grid deal-grid--featured">
            {dealsWithCategory.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                variant="compact"
              />
            ))}
          </div>
        )}
      </section>

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

      <div className="ad-frame">
        <AdSlot slot="8909564330" />
      </div>
    </div>
  );
}
