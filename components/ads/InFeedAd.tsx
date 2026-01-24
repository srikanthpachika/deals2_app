"use client";

import { useEffect } from "react";
import { initAds } from "./adsHelper";

export default function InFeedAd() {
  useEffect(() => {
    initAds();
  }, []);

  return (
    <div className="ad-frame">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot="3523050871"
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
