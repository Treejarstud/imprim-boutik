"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, Download, TrendingUp, Package } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, fmtDateTime } from "@/lib/helpers";

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

  const summary = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce((sum, o) => sum + o.price * (o.quantity || 1), 0);

    const qtyByArticle = {};
    delivered.forEach((o) => {
      qtyByArticle[o.article_title] = (qtyByArticle[o.article_title] || 0) + (o.quantity || 1);
    });
    const best = Object.entries(qtyByArticle).sort((a, b) => b[1] - a[1])[0];

    return {
      revenue,
      deliveredCount: delivered.length,
      bestSeller: best ? { title: best[0], qty: best[1] } : null,
    };
  }, [orders]);

  function exportCsv() {
    const headers = ["Article", "Client", "Téléphone", "Quantité", "Prix unitaire", "Total", "Statut", "Livraison", "Date"];
    const rows = orders.map((o) => [
      o.article_title,
      o.client_name,
      phoneByClient[o.client_id] || "",
      o.quantity || 1,
      o.price,
      o.price * (o.quantity || 1),
      STATUS_LABELS[o.status] || o.status,
      o.location,
      fmtDateTime(o.created_at),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-imprim-boutik-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">Vue d'ensemble</div>
          <button onClick={exportCsv} className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5">
            <Download size={14} /> Exporter les commandes (CSV)
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Chiffre d'affaires (commandes livrées)</div>
            <div className="text-xl font-semibold">{fmtPrice(summary.revenue)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Commandes livrées</div>
            <div className="text-xl font-semibold flex items-center gap-2">
              <Package size={16} className="text-green-600" /> {summary.deliveredCount}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Produit le plus vendu</div>
            <div className="text-sm font-semibold flex items-center gap-2 truncate">
              <TrendingUp size={16} className="text-blue-600 shrink-0" />
              {summary.bestSeller ? `${summary.bestSeller.title} (${summary.bestSeller.qty})` : "—"}
            </div>
          </div>
        </div>
      </div>

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
                  <span className="text-xs text-gray-400">{a.views || 0} vues · stock {a.stock ?? 0}</span>
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
                    Qté {o.quantity || 1} · {fmtPrice(o.price * (o.quantity || 1))} · {fmtDateTime(o.created_at)}
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
