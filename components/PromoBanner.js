"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PromoBanner() {
  const [promos, setPromos] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("promotions").select("*").eq("active", true).order("created_at", { ascending: false });
      setPromos(data || []);
    })();
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % promos.length), 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

  if (promos.length === 0) return null;

  const promo = promos[index];
  const Wrapper = promo.link_url ? "a" : "div";
  const wrapperProps = promo.link_url ? { href: promo.link_url, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4">
      <Wrapper {...wrapperProps} className="block rounded-lg overflow-hidden border border-gray-200 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={promo.image_url} alt={promo.title} className="w-full max-h-48 object-cover" />
        {promos.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {promos.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        )}
      </Wrapper>
    </div>
  );
}
