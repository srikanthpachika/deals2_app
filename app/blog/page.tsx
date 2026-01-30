import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="page-title">Deal2Pro growth playbook</h1>
          <p className="page-subtitle">
            Practical, repeatable marketing moves you can run on Reddit and beyond.
          </p>
        </div>
        <Link href="/" className="btn btn--soft btn--back">
          Back to deals
        </Link>
      </header>

      <section className="content-card-grid">
        <article className="content-card">
          <div>
            <p className="content-card__type">Reddit playbook</p>
            <h2 className="content-card__title">Earn trust before you promote</h2>
            <p className="content-card__desc">
              Prioritize community rules and helpful context over links.
            </p>
            <ul className="side-list">
              <li>Post clear titles: product + price + % off.</li>
              <li>Share why the deal is good (price history, size notes).</li>
              <li>Comment with details instead of stuffing the title.</li>
              <li>Rotate categories to avoid looking like spam.</li>
              <li>Always follow each subreddit&apos;s rules and flair.</li>
            </ul>
          </div>
        </article>

        <article className="content-card">
          <div>
            <p className="content-card__type">Post templates</p>
            <h2 className="content-card__title">Fast, clean copy you can reuse</h2>
            <p className="content-card__desc">
              Keep posts short so the price and % off stand out.
            </p>
            <ul className="side-list">
              <li>&quot;[Product] - $49.99 (38% off, was $79.99)&quot;</li>
              <li>&quot;Prime-only: [Product] down to $19.99 (save $10)&quot;</li>
              <li>&quot;Under $25 deals: [Product] now $24.99 (was $39.99)&quot;</li>
            </ul>
          </div>
        </article>

        <article className="content-card">
          <div>
            <p className="content-card__type">Weekly campaigns</p>
            <h2 className="content-card__title">Build recurring series</h2>
            <p className="content-card__desc">
              Repetition makes the audience expect your posts.
            </p>
            <ul className="side-list">
              <li>&quot;Best Amazon deals under $25 (Friday)&quot;</li>
              <li>&quot;Top electronics drops this week&quot;</li>
              <li>&quot;Amazon clearance watchlist&quot;</li>
            </ul>
          </div>
        </article>

        <article className="content-card">
          <div>
            <p className="content-card__type">Tracking</p>
            <h2 className="content-card__title">Know what converts</h2>
            <p className="content-card__desc">
              Track clicks by source and double down on what works.
            </p>
            <ul className="side-list">
              <li>Tag posts by channel in a simple spreadsheet.</li>
              <li>Log top-performing categories weekly.</li>
              <li>Keep a &quot;winning titles&quot; list to reuse.</li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
