"use client";

import Link from "next/link";
import { LogIn, LogOut, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, profile, logout, openAuth } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="leading-tight">
          <div className="font-bold text-lg text-gray-900">Imprim Boutik</div>
          <div className="text-[11px] text-gray-500 -mt-0.5">La boutique des imprimeurs</div>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {user && <NotificationBell />}
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/mes-commandes" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:flex items-center gap-1.5">
                <ClipboardList size={15} /> Mes commandes
              </Link>
              <Link href="/profil" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <span className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {profile?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">{profile?.prenom?.[0]?.toUpperCase() || "?"}</span>
                  )}
                </span>
                <span className="hidden sm:inline">{profile ? `${profile.prenom} ${profile.nom}` : "Mon compte"}</span>
              </Link>
              <button onClick={logout} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200" title="Se déconnecter">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuth("login")}
              className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5"
            >
              <LogIn size={15} /> Mon compte
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
