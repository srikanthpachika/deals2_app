// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import BottomStickyAd from "@/components/ads/BottomStickyAd"; // we'll create this

export const metadata: Metadata = {
  title: "Deals2Beat",
  description: "Best Deals & Discounts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Global AdSense script */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        {/* If you have a Navbar component, it would be here */}
        {children}

        {/* Bottom sticky mobile ad */}
        <BottomStickyAd />
      </body>
    </html>
  );
}
