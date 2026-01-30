"use client";

import { useEffect } from "react";

export default function StickyHeaderController() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".top-shell");
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const currentY = window.scrollY;
      const goingDown = currentY > lastY;

      if (currentY > 120) {
        header.classList.add("top-shell--compact");
        if (goingDown && currentY > 220) {
          header.classList.add("top-shell--hidden");
        } else {
          header.classList.remove("top-shell--hidden");
        }
      } else {
        header.classList.remove("top-shell--compact", "top-shell--hidden");
      }

      lastY = currentY;
      ticking = false;
    };

    const onScrollThrottled = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(onScroll);
    };

    window.addEventListener("scroll", onScrollThrottled, { passive: true });
    return () => window.removeEventListener("scroll", onScrollThrottled);
  }, []);

  return null;
}
