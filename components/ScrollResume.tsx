"use client";

import { useEffect, useState } from "react";

const SCROLL_KEY = "d2p-scroll";
const SCROLL_TS_KEY = "d2p-scroll-ts";

export default function ScrollResume() {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(SCROLL_KEY) || "");
    const storedAt = Number(localStorage.getItem(SCROLL_TS_KEY) || "");
    const fresh = Number.isFinite(storedAt) && Date.now() - storedAt < 1000 * 60 * 60 * 24 * 7;

    if (Number.isFinite(stored) && stored > 600 && fresh) {
      setPosition(stored);
      setShow(true);
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        localStorage.setItem(SCROLL_KEY, String(window.scrollY));
        localStorage.setItem(SCROLL_TS_KEY, String(Date.now()));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      className="resume-chip"
      type="button"
      onClick={() => {
        window.scrollTo({ top: position, behavior: "smooth" });
      }}
    >
      Resume where you left off
    </button>
  );
}
