import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Legal</p>
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">
            Use Deal2Pro at your own discretion and verify pricing before
            purchase.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to deals
        </Link>
      </header>

      <section className="content-section">
        <h2 className="section-title">Accuracy</h2>
        <p className="section-subtitle">
          We aim to keep pricing accurate, but deals can change quickly. Always
          confirm the final price on Amazon before buying.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">Use of content</h2>
        <p className="section-subtitle">
          You may share Deal2Pro links for personal use. Automated scraping or
          redistribution without permission is not allowed.
        </p>
      </section>
    </div>
  );
}
