import Link from "next/link";
import { CONTENT_POSTS } from "@/lib/content";

export default function ArticlesPage() {
  const posts = CONTENT_POSTS.filter((post) => post.type === "article");

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Articles</p>
          <h1 className="page-title">Deal2Pro articles</h1>
          <p className="page-subtitle">
            Clean deal roundups and quick reads you can trust.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to deals
        </Link>
      </header>

      <section className="content-card-grid">
        {posts.map((post) => (
          <article key={post.href} className="content-card">
            <div>
              <p className="content-card__type">{post.type}</p>
              <h2 className="content-card__title">{post.title}</h2>
              <p className="content-card__desc">{post.description}</p>
            </div>
            <Link href={post.href} className="btn btn--primary">
              Read article
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
