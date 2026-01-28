import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Legal</p>
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">
            A clear summary of how Deal2Pro handles data.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to deals
        </Link>
      </header>

      <section className="content-section">
        <h2 className="section-title">What we collect</h2>
        <p className="section-subtitle">
          We collect basic analytics and usage data to improve the experience.
          We do not sell your personal information.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">Cookies</h2>
        <p className="section-subtitle">
          Cookies may be used for analytics and to keep the site running smoothly.
          You can disable cookies in your browser settings.
        </p>
      </section>

      <section className="content-section">
        <h2 className="section-title">Contact</h2>
        <p className="section-subtitle">
          Questions? Reach out via the Contact Us page.
        </p>
      </section>
    </div>
  );
}
