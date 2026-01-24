"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function BottomStickyAd() {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        // @ts-ignore
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // ignore AdSense init errors locally
    }
  }, []);

  return (
    <div className="ad-sticky">
      <div className="ad-sticky__inner">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot="8909564330"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
