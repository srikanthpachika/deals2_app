'use client';
import { useEffect, useRef } from 'react';

export default function AdSlot({ slot, style }: { slot: string; style?: React.CSSProperties }) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try { // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({}); 
    } catch {}

    const timer = setTimeout(() => {
      const el = adRef.current;
      if (!el) return;
      const status = el.getAttribute('data-ad-status');
      if (status !== 'filled') {
        const frame = el.closest('.ad-frame') as HTMLElement | null;
        if (frame) frame.style.display = 'none';
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null;
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={style || { display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
