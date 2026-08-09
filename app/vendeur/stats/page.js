"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, fmtDate } from "@/lib/helpers";

export default function StatsPage() {
  const [articles, setArticles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: arts }, { data: ords }] = await Promise.all([
      supabase.from("articles").select("*").order("views", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    setArticles(arts || []);
    setOrders(ords || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markPaid(orderId) {
    await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
    load();
  }

  if (loading) return <div className="text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="font-semibold text-lg mb-3">Statistiques par article</div>
        <div className="space-y-2">
          {articles.length === 0 && <div className="text-sm text-gray-400">Aucun article.</div>}
          {articles.map((a) => {
            const artOrders = orders.filter((o) => o.article_id === a.id);
            const paid = artOrders.filter((o) => o.status === "paid").length;
            const pending = artOrders.filter((o) => o.status === "pending").length;
            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="text-xs text-gray-400">{a.views || 0} vues</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span>
                    Payées : <b className="text-green-600">{paid}</b>
                  </span>
                  <span>
                    En attente : <b className="text-orange-500">{pending}</b>
                  </span>
                </div>
                <div className="flex h-1.5 mt-2 w-full rounded-full overflow-hidden bg-gray-100">
                  <div style={{ width: `${(paid / Math.max(1, paid + pending)) * 100}%` }} className="bg-green-500" />
                  <div style={{ width: `${(pending / Math.max(1, paid + pending)) * 100}%` }} className="bg-orange-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="font-semibold text-lg mb-3">Commandes récentes</div>
        <div className="space-y-2">
          {orders.length === 0 && <div className="text-sm text-gray-400">Aucune commande.</div>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-sm font-medium">
                  {o.article_title} — {o.client_name}
                </div>
                <div className="text-xs text-gray-400">
                  {fmtPrice(o.price)} · {o.location} · {fmtDate(o.created_at)}
                </div>
              </div>
              {o.status === "pending" ? (
                <button onClick={() => markPaid(o.id)} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  Marquer payée (livrée)
                </button>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Payée</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
