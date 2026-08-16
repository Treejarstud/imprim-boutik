"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Upload, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { uploadImage } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";

export default function PromotionsPage() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromotions(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p) {
    await supabase.from("promotions").update({ active: !p.active }).eq("id", p.id);
    load();
  }

  async function remove(id) {
    if (!window.confirm("Supprimer cette bannière ?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-lg">Promotions</div>
          <p className="text-xs text-gray-400 mt-0.5">Bannières affichées en haut de la boutique, au-dessus du catalogue.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
          <Plus size={15} /> Nouvelle bannière
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : (
        <div className="space-y-2">
          {promotions.length === 0 && <div className="text-sm text-gray-400">Aucune bannière pour l'instant.</div>}
          {promotions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2.5 flex-wrap">
              <div className="w-20 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <ImageOff size={16} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-[8rem]">
                <div className="text-sm truncate">{p.title}</div>
                {p.link_url && <div className="text-xs text-gray-400 truncate">{p.link_url}</div>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {p.active ? "Active" : "Désactivée"}
              </span>
              <button onClick={() => toggleActive(p)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={() => remove(p.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PromotionForm
          userId={user?.id}
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function PromotionForm({ userId, onCancel, onSaved }) {
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!title.trim() || !imageFile) {
      setError("Le titre et l'image sont obligatoires.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const image_url = await uploadImage("promo-images", imageFile, userId);
      const { error: err } = await supabase.from("promotions").insert({
        title: title.trim(),
        image_url,
        link_url: linkUrl.trim() || null,
        active: true,
      });
      if (err) throw err;
      onSaved();
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onCancel}>
      <div className="font-semibold text-lg mb-4">Nouvelle bannière</div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Titre (texte alternatif de l'image)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Lien (optionnel — vers un article, une page, un site externe)</label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Image (format large recommandé, ex : 1200×300px)</label>
          <div className="flex items-center gap-3 mt-1">
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} className="w-24 h-14 object-cover rounded-md border border-gray-200" alt="" />
            )}
            <label className="text-sm border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex items-center gap-1 hover:bg-gray-50">
              <Upload size={14} /> Choisir
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button onClick={save} disabled={busy} className="w-full text-sm px-3 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 mt-2">
          {busy ? "Un instant…" : "Enregistrer"}
        </button>
      </div>
    </Modal>
  );
}
