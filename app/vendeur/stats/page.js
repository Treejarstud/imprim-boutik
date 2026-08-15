"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, fmtDate } from "@/lib/helpers";

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmée",
  delivered: "Livrée",
  cancelled: "Annulée",
};
const STATUS_COLORS = {
  pending: "bg-orange-100 text-orange-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};
const NEXT_STATUS = { pending: "confirmed", confirmed: "delivered" };
const NEXT_LABEL = { pending: "Confirmer", confirmed: "Marquer livrée" };

export default function StatsPage() {
  const [articles, setArticles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [phoneByClient, setPhoneByClient] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: arts }, { data: ords }, { data: profiles }] = await Promise.all([
      supabase.from("articles").select("*").order("views", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, telephone"),
    ]);
    setArticles(arts || []);
    setOrders(ords || []);
    setPhoneByClient(Object.fromEntries((profiles || []).map((p) => [p.id, p.telephone])));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await supabase.from("orders").update({ status: next }).eq("id", order.id);
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
            const delivered = artOrders.filter((o) => o.status === "delivered").length;
            const confirmed = artOrders.filter((o) => o.status === "confirmed").length;
            const pending = artOrders.filter((o) => o.status === "pending").length;
            const total = Math.max(1, delivered + confirmed + pending);
            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="text-xs text-gray-400">{a.views || 0} vues</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span>
                    Livrées : <b className="text-green-600">{delivered}</b>
                  </span>
                  <span>
                    Confirmées : <b className="text-blue-600">{confirmed}</b>
                  </span>
                  <span>
                    En attente : <b className="text-orange-500">{pending}</b>
                  </span>
                </div>
                <div className="flex h-1.5 mt-2 w-full rounded-full overflow-hidden bg-gray-100">
                  <div style={{ width: `${(delivered / total) * 100}%` }} className="bg-green-500" />
                  <div style={{ width: `${(confirmed / total) * 100}%` }} className="bg-blue-500" />
                  <div style={{ width: `${(pending / total) * 100}%` }} className="bg-orange-400" />
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
            <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm font-medium">
                    {o.article_title} — {o.client_name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Qté {o.quantity || 1} · {fmtPrice(o.price * (o.quantity || 1))} · {fmtDate(o.created_at)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Livraison : {o.location}</div>
                  {phoneByClient[o.client_id] && (
                    <a href={`tel:${phoneByClient[o.client_id]}`} className="text-xs text-blue-600 hover:underline mt-0.5 flex items-center gap-1 w-fit">
                      <Phone size={11} /> {phoneByClient[o.client_id]}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                  {NEXT_STATUS[o.status] && (
                    <button onClick={() => advanceStatus(o)} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                      {NEXT_LABEL[o.status]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
