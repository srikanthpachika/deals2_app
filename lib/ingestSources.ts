export type FeedSource = {
  name: string;
  url: string;
};

export const FEED_SOURCES: FeedSource[] = [
  {
    name: "Slickdeals (Amazon search)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon",
  },
  {
    name: "Slickdeals (Amazon electronics)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+electronics",
  },
  {
    name: "Slickdeals (Amazon clothing)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+clothing",
  },
  {
    name: "Slickdeals (Amazon cleaning)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+cleaning",
  },
  {
    name: "Slickdeals (Amazon home)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+home",
  },
  {
    name: "Slickdeals (Amazon beauty)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+beauty",
  },
  {
    name: "Slickdeals (Amazon grocery)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+grocery",
  },
  {
    name: "Slickdeals (Amazon toys)",
    url: "https://slickdeals.net/newsearch.php?searchin=first&sort=newest&rss=1&q=amazon+toys",
  },
  {
    name: "Ben's Bargains",
    url: "https://bensbargains.com/rss/",
  },
];
