"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";

export default function FavorisPage() {
  const { user, loading: authLoading, openAuth } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: favs } = await supabase.from("favorites").select("article_id").eq("client_id", user.id);
      const ids = (favs || []).map((f) => f.article_id);
      setFavoriteIds(new Set(ids));
      if (ids.length > 0) {
        const { data: arts } = await supabase.from("articles_with_stats").select("*").in("id", ids);
        setArticles(arts || []);
      }
      setLoading(false);
    })();
  }, [user]);

  async function toggleFavorite(article) {
    const next = new Set(favoriteIds);
    next.delete(article.id);
    setFavoriteIds(next);
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
    await supabase.from("favorites").delete().eq("client_id", user.id).eq("article_id", article.id);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="font-semibold text-lg mb-2">Mes favoris</div>
          <p className="text-sm text-gray-500 mb-4">Connectez-vous pour voir vos articles sauvegardés.</p>
          <button onClick={() => openAuth("login")} className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
          ← Retour à la boutique
        </button>
        <div className="font-semibold text-xl mb-4">Mes favoris</div>

        {articles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
            Aucun favori pour l'instant. Cliquez sur le cœur d'un article pour l'ajouter ici.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} isFavorite={favoriteIds.has(a.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
