"use client";

import { useState } from "react";
import { Search, UserPlus, UserMinus, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export default function EquipePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, nom, prenom, telephone, role")
      .ilike("telephone", `%${query.trim()}%`);
    setResults(data || []);
    setSearching(false);
  }

  async function setRole(profileId, role) {
    await supabase.from("profiles").update({ role }).eq("id", profileId);
    setResults((prev) => prev.map((p) => (p.id === profileId ? { ...p, role } : p)));
  }

  return (
    <div>
      <div className="font-semibold text-lg mb-1">Équipe</div>
      <p className="text-xs text-gray-400 mb-4">
        Recherchez un client par numéro de téléphone pour lui donner (ou retirer) l'accès à l'espace vendeur.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Numéro de téléphone du client"
          className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
        />
        <button onClick={search} className="text-sm px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
          <Search size={14} /> Rechercher
        </button>
      </div>

      {searching && <div className="text-sm text-gray-400">Recherche…</div>}

      {!searching && searched && results.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
          Aucun compte trouvé avec ce numéro.
        </div>
      )}

      <div className="space-y-2">
        {results.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 flex-wrap gap-2">
            <div>
              <div className="text-sm font-medium">
                {p.prenom} {p.nom}
              </div>
              <div className="text-xs text-gray-400">{p.telephone}</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  p.role === "vendor" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.role === "vendor" && <ShieldCheck size={11} />}
                {p.role === "vendor" ? "Vendeur" : "Client"}
              </span>
              {p.role === "vendor" ? (
                p.id !== user?.id && (
                  <button
                    onClick={() => setRole(p.id, "client")}
                    className="text-xs px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
                  >
                    <UserMinus size={13} /> Retirer l'accès
                  </button>
                )
              ) : (
                <button
                  onClick={() => setRole(p.id, "vendor")}
                  className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                >
                  <UserPlus size={13} /> Promouvoir vendeur
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
