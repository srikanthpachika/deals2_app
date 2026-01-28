import Link from "next/link";

export default function ContactUs() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Company</p>
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">
            Have feedback or want a deal reviewed? Reach out.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to deals
        </Link>
      </header>

      <section className="card">
        <h2 className="card__title">Email</h2>
        <p className="muted">support@deal2pro.com</p>
        <p className="micro">
          Replace this address with your real support inbox.
        </p>
      </section>
    </div>
  );
}
