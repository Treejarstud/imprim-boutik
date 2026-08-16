"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Truck, Ruler, ShieldCheck, MessageCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import ActivitiesSection from "@/components/ActivitiesSection";
import AdSlot from "@/components/AdSlot";
import ArticleCard from "@/components/ArticleCard";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: arts }] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("articles_with_stats").select("*").eq("published", true).order("created_at", { ascending: false }),
      ]);
      setCategories(cats || []);
      setArticles(arts || []);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(
    () => articles.filter((a) => selectedCat === "all" || a.category_id === selectedCat),
    [articles, selectedCat]
  );

  const popular = useMemo(() => [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4), [articles]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E293B 0%, #1D4ED8 55%, #3B82F6 100%)" }}>
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
            <Sparkles size={13} /> La boutique des imprimeurs
          </div>
          <h1 className="text-white text-3xl sm:text-4xl font-bold max-w-xl leading-tight">
            Tout ce qu'il faut pour équiper votre atelier d'impression
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mt-3 max-w-lg">
            Supports, matériaux de découpe, pièces détachées et machines professionnelles — installation et formation incluses.
          </p>
          <a href="#catalogue" className="inline-flex items-center gap-2 mt-6 bg-white text-blue-700 font-medium text-sm px-5 py-2.5 rounded-md hover:bg-blue-50">
            Découvrir le catalogue
          </a>
        </div>
      </div>

      <PromoBanner />

      <ActivitiesSection />

      {/* Trust badges */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Truck, label: "Livraison à l'adresse indiquée" },
            { icon: Ruler, label: "Formats sur mesure" },
            { icon: ShieldCheck, label: "Qualité contrôlée" },
            { icon: MessageCircle, label: "Support par chat" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <f.icon size={16} className="text-blue-600 shrink-0" />
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6" id="catalogue">
        {!loading && popular.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-blue-600" />
              <h2 className="font-semibold text-lg">Les plus consultés</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {popular.map((a) => (
                <ArticleCard key={a.id} article={a} highlight />
              ))}
            </div>
          </div>
        )}

        <AdSlot slot="1111111111" className="mb-6" />

        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setSelectedCat("all")}
            className={`text-sm px-3 py-1.5 rounded-full border ${selectedCat === "all" ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            Toutes
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`text-sm px-3 py-1.5 rounded-full border ${selectedCat === c.id ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Chargement…</div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
            Aucun article publié pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {visible.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>

      <Footer categories={categories} />
    </div>
  );
}
