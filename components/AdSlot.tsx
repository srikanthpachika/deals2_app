'use client';
import { useEffect } from 'react';

export default function AdSlot({ slot, style }: { slot: string; style?: React.CSSProperties }) {
  useEffect(() => {
    try { // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({}); 
    } catch {}
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null;

  return (
    <ins className="adsbygoogle"
      style={style || { display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
