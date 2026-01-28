import Link from "next/link";

export default function HowWeFindLegitAmazonPriceDrops() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Guide</p>
          <h1 className="page-title">How We Find Legit Amazon Price Drops</h1>
          <p className="page-subtitle">
            A transparent look at the filters and checks behind every Deal2Pro
            listing.
          </p>
        </div>
        <Link href="/guides" className="btn btn--ghost">
          Back to guides
        </Link>
      </header>

      <section className="content-section">
        <h2 className="section-title">1) Curated sources</h2>
        <p className="section-subtitle">
          We ingest from a focused list of deal feeds, then only keep Amazon-only
          links. This avoids irrelevant retailers and keeps the feed clean.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">2) Amazon-only normalization</h2>
        <p className="section-subtitle">
          We normalize product URLs to the canonical Amazon format, remove
          tracking parameters, and apply the Deal2Pro affiliate tag for a direct
          checkout experience.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">3) Title cleanup & clarity</h2>
        <p className="section-subtitle">
          Messy titles are cleaned into a simple product name, followed by the
          percent-off when it's explicitly available. Any extra detail (sizes,
          colors, shipping notes) is moved into the description.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">4) Freshness & cadence</h2>
        <p className="section-subtitle">
          We keep deals live based on recency and expiry rules, and the homepage
          refreshes on a 10-minute cadence for new drops.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">5) Manual additions</h2>
        <p className="section-subtitle">
          Admin tools allow manual inserts for special finds or corrections so
          high-quality deals never get missed.
        </p>
      </section>
    </div>
  );
}
