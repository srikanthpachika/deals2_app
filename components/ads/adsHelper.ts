// components/ads/adsHelper.ts
export function initAds() {
  if (typeof window === "undefined") return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    (window as any).adsbygoogle.push({});
  } catch (e) {
    // console.warn("Adsense error", e);
  }
}
