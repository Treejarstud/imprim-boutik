"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, Package, BarChart3, Users, LogOut, Loader2, Megaphone, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const TABS = [
  { href: "/vendeur/categories", label: "Catégories", icon: Layers },
  { href: "/vendeur/promotions", label: "Promotions", icon: Megaphone },
  { href: "/vendeur/articles", label: "Articles", icon: Package },
  { href: "/vendeur/stats", label: "Statistiques", icon: BarChart3, badge: "pending" },
  { href: "/vendeur/messages", label: "Messagerie", icon: Users, badge: "messages" },
  { href: "/vendeur/equipe", label: "Équipe", icon: UsersRound },
];

export default function VendeurLayout({ children }) {
  const { user, profile, loading, isVendor, logout, openAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isVendor) return;

    let active = true;
    async function loadCount() {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (active) setPendingCount(count || 0);
    }
    loadCount();

    // Se met à jour en direct : nouvelle commande, ou commande traitée par le vendeur
    const channel = supabase
      .channel("vendor-orders-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadCount())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [isVendor]);

  useEffect(() => {
    if (!isVendor) return;

    let active = true;
    async function loadUnread() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("from_role", "client")
        .eq("read", false);
      if (active) setUnreadMessages(count || 0);
    }
    loadUnread();

    const channel = supabase
      .channel("vendor-messages-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadUnread())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [isVendor]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4 text-center">
        <div className="font-semibold text-lg">Espace professionnel</div>
        <p className="text-sm text-gray-500 max-w-sm">Connectez-vous avec un compte vendeur pour accéder à cet espace.</p>
        <button onClick={() => openAuth("login")} className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          Se connecter
        </button>
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 px-4 text-center">
        <div className="font-semibold text-lg">Accès refusé</div>
        <p className="text-sm text-gray-500 max-w-sm">
          Ce compte ({profile?.prenom} {profile?.nom}) n'a pas les droits vendeur.
        </p>
        <button onClick={() => router.push("/")} className="text-sm px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">
          Retour à la boutique
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/vendeur" className="font-bold text-lg flex items-center gap-2 flex-wrap">
            Imprim Boutik <span className="text-sm font-normal text-gray-400">· espace pro</span>
            {pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                {pendingCount} nouvelle{pendingCount > 1 ? "s" : ""} commande{pendingCount > 1 ? "s" : ""}
              </span>
            )}
            {unreadMessages > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                {unreadMessages} nouveau{unreadMessages > 1 ? "x" : ""} message{unreadMessages > 1 ? "s" : ""}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200">
              Voir la boutique
            </Link>
            <button onClick={logout} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200" title="Se déconnecter">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid sm:grid-cols-[170px_1fr] gap-6">
        <nav className="flex sm:flex-col gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`text-sm px-3 py-2 rounded-md flex items-center gap-2 whitespace-nowrap ${pathname === t.href ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <t.icon size={15} /> {t.label}
              {t.badge === "pending" && pendingCount > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    pathname === t.href ? "bg-white text-blue-600" : "bg-orange-500 text-white"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
              {t.badge === "messages" && unreadMessages > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    pathname === t.href ? "bg-white text-blue-600" : "bg-red-500 text-white"
                  }`}
                >
                  {unreadMessages}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
