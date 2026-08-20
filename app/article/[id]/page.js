"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, MapPin, Loader2, Check, ImageOff, Minus, Plus, ClipboardList, Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, fmtDate } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSlot from "@/components/AdSlot";
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
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

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

  useEffect(() => {
    if (!user || !id) {
      setIsFavorite(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("favorites").select("id").eq("client_id", user.id).eq("article_id", id).maybeSingle();
      setIsFavorite(!!data);
    })();
  }, [user, id]);

  async function toggleFavorite() {
    if (!user) return openAuth("login");
    if (isFavorite) {
      setIsFavorite(false);
      await supabase.from("favorites").delete().eq("client_id", user.id).eq("article_id", id);
    } else {
      setIsFavorite(true);
      await supabase.from("favorites").insert({ client_id: user.id, article_id: id });
    }
  }

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
    setOrderError("");

    const { data: stockOk, error: stockErr } = await supabase.rpc("decrement_stock", {
      p_article_id: article.id,
      p_quantity: quantity,
    });

    if (stockErr || !stockOk) {
      setOrderBusy(false);
      setOrderError("Stock insuffisant pour cette quantité. Un autre client vient peut-être de commander.");
      return;
    }

    const { error } = await supabase.from("orders").insert({
      article_id: article.id,
      client_id: user.id,
      client_name: `${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Client",
      article_title: article.title,
      price: article.price,
      quantity,
      location: location.trim(),
      status: "pending",
    });
    setOrderBusy(false);
    if (!error) {
      setOrderDone(true);
      setArticle((prev) => (prev ? { ...prev, stock: Math.max(0, (prev.stock || 0) - quantity) } : prev));
      fetch("/api/notify-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleTitle: article.title,
          clientName: `${profile?.prenom || ""} ${profile?.nom || ""}`.trim() || "Client",
          quantity,
          total: fmtPrice(article.price * quantity),
          location: location.trim(),
        }),
      }).catch(() => {});
    }
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
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-xl">{article.title}</div>
              <button
                onClick={toggleFavorite}
                className="shrink-0 p-2 rounded-md hover:bg-gray-100"
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart size={18} fill={isFavorite ? "#EF4444" : "none"} stroke={isFavorite ? "#EF4444" : "#4B5563"} />
              </button>
            </div>
            <p className="text-sm mt-3 text-gray-600">{article.description}</p>
            <div className="text-lg font-semibold mt-3">{fmtPrice(article.price)}</div>
            <div className={`text-xs mt-1 ${article.stock > 0 ? "text-gray-500" : "text-red-600 font-medium"}`}>
              {article.stock > 0 ? `En stock : ${article.stock}` : "Rupture de stock"}
            </div>

            {!ordering && !orderDone && (
              <button
                onClick={() => (user ? setOrdering(true) : openAuth("login"))}
                disabled={article.stock <= 0}
                className="mt-4 w-full text-sm px-3 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-blue-600"
              >
                <ShoppingBag size={15} /> {article.stock > 0 ? "Commander" : "Indisponible"}
              </button>
            )}

            {ordering && !orderDone && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <label className="text-xs font-medium text-gray-600">Quantité</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(article.stock, q + 1))}
                    disabled={quantity >= article.stock}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    Total : <span className="font-semibold text-gray-900">{fmtPrice(article.price * quantity)}</span>
                  </span>
                </div>

                <label className="text-xs font-medium text-gray-600 mt-4 block">Localisation de livraison</label>
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
                {orderError && <div className="text-xs text-red-600 mt-2">{orderError}</div>}
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
              <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-green-700 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Check size={16} /> Commande enregistrée — vous payerez à la livraison.
                </div>
                <a href="/mes-commandes" className="text-blue-600 underline text-xs flex items-center gap-1 w-fit">
                  <ClipboardList size={13} /> Suivre mes commandes
                </a>
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

        <AdSlot slot="2222222222" className="mt-6" />

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
