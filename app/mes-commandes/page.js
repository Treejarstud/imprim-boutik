"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, fmtDate } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const STATUS_INFO = {
  pending: { label: "En attente", icon: Clock, color: "text-orange-600 bg-orange-50 border-orange-200" },
  confirmed: { label: "Confirmée", icon: CheckCircle2, color: "text-blue-600 bg-blue-50 border-blue-200" },
  delivered: { label: "Livrée", icon: PackageCheck, color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Annulée", icon: XCircle, color: "text-gray-500 bg-gray-100 border-gray-200" },
};

export default function MesCommandesPage() {
  const { user, loading: authLoading, openAuth } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (active) setOrders(data || []);
      setLoading(false);
    }
    load();

    // Met à jour la liste en direct si le vendeur change le statut pendant que la page est ouverte
    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` },
        (payload) => setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function cancelOrder(order) {
    if (!window.confirm("Annuler cette commande ?")) return;
    setCancellingId(order.id);
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)));
    }
    setCancellingId(null);
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
          <div className="font-semibold text-lg mb-2">Mes commandes</div>
          <p className="text-sm text-gray-500 mb-4">Connectez-vous pour voir vos commandes.</p>
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
          ← Retour à la boutique
        </button>
        <div className="font-semibold text-xl mb-4">Mes commandes</div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
            Vous n'avez pas encore passé de commande.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const info = STATUS_INFO[o.status] || STATUS_INFO.pending;
              const Icon = info.icon;
              return (
                <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-medium text-sm">{o.article_title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quantité : {o.quantity || 1} · {fmtDate(o.created_at)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">Livraison : {o.location}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${info.color}`}>
                        <Icon size={13} /> {info.label}
                      </div>
                      <div className="text-sm font-semibold mt-2">{fmtPrice(o.price * (o.quantity || 1))}</div>
                    </div>
                  </div>
                  {o.status === "pending" && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-right">
                      <button
                        onClick={() => cancelOrder(o)}
                        disabled={cancellingId === o.id}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {cancellingId === o.id ? "Annulation…" : "Annuler la commande"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
