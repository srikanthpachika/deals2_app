import Link from "next/link";

export default function AffiliateDisclosure() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Company</p>
          <h1 className="page-title">Affiliate Disclosure</h1>
          <p className="page-subtitle">
            Deal2Pro participates in affiliate programs, including Amazon.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to deals
        </Link>
      </header>

      <section className="content-section">
        <h2 className="section-title">How affiliate links work</h2>
        <p className="section-subtitle">
          When you click an Amazon link on Deal2Pro, we may earn a small
          commission. This does not change your price and helps keep the site
          running.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">Editorial independence</h2>
        <p className="section-subtitle">
          Affiliate relationships do not influence which deals we surface.
          Rankings are based on freshness and relevance.
        </p>
      </section>
    </div>
  );
}
