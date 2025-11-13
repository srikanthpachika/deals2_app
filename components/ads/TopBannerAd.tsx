"use client";

import { useEffect } from "react";
import { initAds } from "./adsHelper";

export default function TopBannerAd() {
  useEffect(() => {
    initAds();
  }, []);

  return (
    <div className="w-full flex justify-center my-4">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot="6474972689"  // TODO: replace with your Ad Slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
