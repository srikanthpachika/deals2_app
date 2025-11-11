import { parse } from 'node-html-parser';

function absolutize(src: string, baseUrl: string) {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return src;
  }
}

export async function scrapeOG(url: string) {
  const res = await fetch(url, {
    headers: {
      // Many retailers (incl. Amazon) change output based on UA & accept
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    // Don’t follow too many redirects
    redirect: 'follow',
  });

  const html = await res.text();
  const root = parse(html);

  const meta = (prop: string) =>
    root.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
    root.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');

  // Title / description
  const title =
    meta('og:title') ||
    root.querySelector('title')?.text?.trim() ||
    url;

  const description =
    meta('og:description') ||
    meta('description') ||
    '';

  // Try multiple image locations
  let image =
    meta('og:image') ||
    meta('og:image:secure_url') ||
    meta('twitter:image') ||
    root.querySelector('link[rel="image_src"]')?.getAttribute('href') ||
    root.querySelector('#landingImage')?.getAttribute('data-old-hires') ||        // Amazon classic
    root.querySelector('#landingImage')?.getAttribute('src') ||
    root.querySelector('img[data-a-dynamic-image]')?.getAttribute('src') || '';

  if (image) image = absolutize(image, url);

  const price =
    meta('product:price:amount') ||
    // Amazon sometimes has price in meta name="price" or data-asin-price, but we’ll keep this simple
    '';

  const siteName =
    meta('og:site_name') ||
    new URL(url).hostname.replace(/^www\./, '');

  return { title, description, image, price, siteName };
}
