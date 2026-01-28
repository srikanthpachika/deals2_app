export type ContentType = "article" | "guide" | "blog" | "review";

export type ContentPost = {
  title: string;
  description: string;
  type: ContentType;
  href: string;
};

export const CONTENT_POSTS: ContentPost[] = [
  {
    title: "Best Amazon Deals This Week (Updated Daily)",
    description:
      "A running list of today's strongest Amazon discounts, updated as new drops land.",
    type: "article",
    href: "/articles/best-amazon-deals-this-week",
  },
  {
    title: "How We Find Legit Amazon Price Drops",
    description:
      "A transparent look at our ingest filters, cleanup rules, and approval flow.",
    type: "guide",
    href: "/guides/how-we-find-legit-amazon-price-drops",
  },
  {
    title: "Best Electronics Deals Under $100",
    description:
      "Budget-friendly electronics picks with clean savings and simple checkout.",
    type: "blog",
    href: "/blog/best-electronics-deals-under-100",
  },
  {
    title: "Deal2Pro vs Slickdeals - What's Different?",
    description:
      "A practical comparison of experience, clarity, and how quickly you can buy.",
    type: "review",
    href: "/reviews/deal2pro-vs-slickdeals",
  },
];
