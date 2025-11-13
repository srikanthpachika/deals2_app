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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 border-t border-gray-200">
      <div className="max-w-md mx-auto py-1 flex justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot="8909564330"  // <-- replace with real slot
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
