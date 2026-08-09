"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [articleCounts, setArticleCounts] = useState({});
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: cats }, { data: arts }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("articles").select("category_id"),
    ]);
    setCategories(cats || []);
    const counts = {};
    (arts || []).forEach((a) => {
      counts[a.category_id] = (counts[a.category_id] || 0) + 1;
    });
    setArticleCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newName.trim() });
    if (!error) {
      setNewName("");
      load();
    }
  }

  async function deleteCategory(id) {
    const count = articleCounts[id] || 0;
    const msg = count > 0 ? `Cette catégorie contient ${count} article(s), qui seront supprimés aussi. Confirmer ?` : "Supprimer cette catégorie ?";
    if (!window.confirm(msg)) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="font-semibold text-lg mb-3">Catégories</div>
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouvelle catégorie (ex : Bâches publicitaires)"
          className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
        />
        <button onClick={addCategory} className="text-sm px-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : (
        <div className="space-y-2">
          {categories.length === 0 && <div className="text-sm text-gray-400">Aucune catégorie.</div>}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2.5">
              <span className="text-sm">{c.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{articleCounts[c.id] || 0} article(s)</span>
                <button onClick={() => deleteCategory(c.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
