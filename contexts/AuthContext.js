"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);
const PENDING_KEY_PREFIX = "imprimboutik_pending_profile:";

// Utilisé par AuthModal : sauvegarde les infos saisies à l'inscription en
// attendant que l'utilisateur confirme son e-mail (si la confirmation est active).
export function savePendingProfile(email, fields) {
  try {
    localStorage.setItem(PENDING_KEY_PREFIX + email.toLowerCase(), JSON.stringify(fields));
  } catch (e) {
    /* stockage indisponible, tant pis */
  }
}

function takePendingProfile(email) {
  const key = PENDING_KEY_PREFIX + email.toLowerCase();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    localStorage.removeItem(key);
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(null); // "login" | "register" | null

  const loadProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).single();

    if (data) {
      setProfile(data);
      return;
    }

    // Pas encore de profil : c'est le premier login après confirmation d'e-mail.
    // On récupère les informations saisies à l'inscription et on crée le profil maintenant.
    const pending = sessionUser.email ? takePendingProfile(sessionUser.email) : null;
    if (pending) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: sessionUser.id, ...pending })
        .select()
        .single();
      setProfile(created || null);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      loadProfile(session?.user || null).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      loadProfile(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    isVendor: profile?.role === "vendor",
    logout,
    authModal,
    openAuth: (mode = "login") => setAuthModal(mode),
    closeAuth: () => setAuthModal(null),
    refreshProfile: () => loadProfile(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé sous AuthProvider");
  return ctx;
}
