"use client";

import { useEffect, useRef } from "react";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

// Emplacement publicitaire Google AdSense. N'affiche rien tant que
// NEXT_PUBLIC_ADSENSE_CLIENT_ID n'est pas configuré (ou que le compte
// AdSense n'a pas été approuvé par Google) — pas d'espace vide ni d'erreur
// en attendant.
export default function AdSlot({ slot, format = "auto", className = "" }) {
  const ref = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // Silencieux : arrive normalement tant que le compte AdSense n'est
      // pas encore validé par Google.
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) return null;

  return (
    <div ref={ref} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
