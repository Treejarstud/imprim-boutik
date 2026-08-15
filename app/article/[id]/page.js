"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, MapPin, Loader2, Check, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, fmtDate } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Stars from "@/components/Stars";

export default function ArticlePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile, openAuth } = useAuth();

  const [article, setArticle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const [ordering, setOrdering] = useState(false);
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  const viewedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: art } = await supabase.from("articles_with_stats").select("*").eq("id", id).single();
      setArticle(art || null);
      const { data: revs } = await supabase
        .from("reviews")
        .select("*")
        .eq("article_id", id)
        .order("created_at", { ascending: false });
      setReviews(revs || []);
      setLoading(false);

      if (!viewedRef.current && art) {
        viewedRef.current = true;
        supabase.rpc("increment_article_views", { p_article_id: id });
      }
    })();
  }, [id]);

  async function submitReview() {
    if (!user) return openAuth("login");
    if (!reviewRating) return;
    setReviewBusy(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        article_id: id,
        client_id: user.id,
        client_name: `${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Client",
        rating: reviewRating,
        comment: reviewComment,
      })
      .select()
      .single();
    if (!error) {
      setReviews((prev) => [data, ...prev]);
      setReviewRating(0);
      setReviewComment("");
    }
    setReviewBusy(false);
  }

  function useMyLocation() {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      alert("Géolocalisation indisponible. Saisissez votre position manuellement.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("Localisation refusée ou indisponible. Saisissez-la manuellement.");
      },
      { timeout: 8000 }
    );
  }

  async function confirmOrder() {
    if (!location.trim() || !user) return;
    setOrderBusy(true);
    const { error } = await supabase.from("orders").insert({
      article_id: article.id,
      client_id: user.id,
      client_name: `${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Client",
      article_title: article.title,
      price: article.price,
      location: location.trim(),
      status: "pending",
    });
    setOrderBusy(false);
    if (!error) setOrderDone(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Article introuvable.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
          ← Retour au catalogue
        </button>

        <div className="grid sm:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-lg p-5">
          <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {article.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={32} className="text-gray-300" />
            )}
          </div>
          <div>
            <div className="font-semibold text-xl">{article.title}</div>
            <p className="text-sm mt-3 text-gray-600">{article.description}</p>
            <div className="text-lg font-semibold mt-3">{fmtPrice(article.price)}</div>

            {!ordering && !orderDone && (
              <button
                onClick={() => (user ? setOrdering(true) : openAuth("login"))}
                className="mt-4 w-full text-sm px-3 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={15} /> Commander
              </button>
            )}

            {ordering && !orderDone && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <label className="text-xs font-medium text-gray-600">Localisation de livraison</label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Adresse ou coordonnées"
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                  />
                  <button onClick={useMyLocation} disabled={locating} className="border border-gray-300 rounded-md px-3 flex items-center gap-1 text-sm hover:bg-gray-50">
                    {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Ma position
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Paiement à la livraison.</p>
                <button
                  onClick={confirmOrder}
                  disabled={!location.trim() || orderBusy}
                  className="mt-3 w-full text-sm px-3 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  {orderBusy ? "Un instant…" : "Confirmer la commande"}
                </button>
              </div>
            )}

            {orderDone && (
              <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-green-700 flex items-center gap-2">
                <Check size={16} /> Commande enregistrée — vous payerez à la livraison.
              </div>
            )}
          </div>
        </div>

        {article.video_url && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
            <div className="font-medium text-sm mb-3">Vidéo de présentation</div>
            <video src={article.video_url} controls className="w-full max-h-96 rounded-lg bg-black" />
          </div>
        )}

        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
          <div className="font-medium text-sm mb-3">Avis clients ({reviews.length})</div>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {reviews.length === 0 && <div className="text-xs text-gray-400">Aucun avis pour l'instant.</div>}
            {reviews.map((r) => (
              <div key={r.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.client_name}</span>
                  <Stars value={r.rating} size={12} />
                  <span className="text-[11px] text-gray-400">{fmtDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-xs text-gray-500 mt-0.5">{r.comment}</p>}
              </div>
            ))}
          </div>

          {user ? (
            <div className="mt-4 border-t border-gray-200 pt-3">
              <div className="text-xs font-medium mb-1">Laisser un avis</div>
              <Stars value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Votre commentaire…"
                rows={2}
                className="w-full border border-gray-300 rounded-md mt-2 p-2 text-sm"
              />
              <button
                onClick={submitReview}
                disabled={!reviewRating || reviewBusy}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 mt-2 disabled:opacity-50"
              >
                Publier l'avis
              </button>
            </div>
          ) : (
            <button onClick={() => openAuth("login")} className="text-sm text-blue-600 underline mt-3">
              Connectez-vous pour laisser un avis
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
