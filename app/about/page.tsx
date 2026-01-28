import Link from "next/link";

export default function AboutUs() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Company</p>
          <h1 className="page-title">About Deal2Pro</h1>
          <p className="page-subtitle">
            A calm, Amazon-only deals feed built for speed and clarity.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to deals
        </Link>
      </header>

      <section className="content-section">
        <h2 className="section-title">Our mission</h2>
        <p className="section-subtitle">
          We want you to find real Amazon price drops without the noise. Deal2Pro
          focuses on clean titles, direct product links, and simple categories.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">What makes us different</h2>
        <p className="section-subtitle">
          We keep the feed Amazon-only, add a clear percent-off when it's
          explicit, and push the extra details into the description so the
          product name stays readable.
        </p>
      </section>
    </div>
  );
}
