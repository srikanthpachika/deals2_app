"use client";

import { useEffect } from "react";
import { initAds } from "./adsHelper";

export default function InFeedAd() {
  useEffect(() => {
    initAds();
  }, []);

  return (
    <div className="my-6 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot="3523050871"   // TODO: replace with your Ad Slot ID
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86" // can adjust in AdSense
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
