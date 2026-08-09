"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fmtPrice, uploadImage } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";

const SUPPORTS = ["Bâche PVC", "Vinyle adhésif", "Toile tendue", "Panneau rigide", "Papier photo"];

export default function ArticlesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [catFilter, setCatFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    const [{ data: cats }, { data: arts }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories(cats || []);
    setArticles(arts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(a) {
    await supabase.from("articles").update({ published: !a.published }).eq("id", a.id);
    load();
  }

  async function deleteArticle(id) {
    if (!window.confirm("Supprimer cet article ?")) return;
    await supabase.from("articles").delete().eq("id", id);
    load();
  }

  const list = articles.filter((a) => !catFilter || a.category_id === catFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-lg">Articles</div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus size={15} /> Nouvel article
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setCatFilter(null)} className={`text-sm px-3 py-1 rounded-full border ${!catFilter ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:bg-gray-100"}`}>
          Toutes
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCatFilter(c.id)} className={`text-sm px-3 py-1 rounded-full border ${catFilter === c.id ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:bg-gray-100"}`}>
            {c.name}
          </button>
        ))}
      </div>

      {categories.length === 0 && <div className="text-sm text-gray-400 mb-3">Créez d'abord une catégorie dans l'onglet Catégories.</div>}

      {loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : (
        <div className="space-y-2">
          {list.length === 0 && <div className="text-sm text-gray-400">Aucun article.</div>}
          {list.map((a) => (
            <div key={a.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2.5 flex-wrap">
              <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {a.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <ImageOff size={16} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-[8rem]">
                <div className="text-sm truncate">{a.title}</div>
                <div className="text-xs text-gray-400">
                  {fmtPrice(a.price)} · {a.views || 0} vues
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${a.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {a.published ? "Publié" : "Brouillon"}
              </span>
              <button onClick={() => togglePublish(a)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                {a.published ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={() => {
                  setEditing(a);
                  setShowForm(true);
                }}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <Pencil size={15} />
              </button>
              <button onClick={() => deleteArticle(a.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ArticleForm
          categories={categories}
          initial={editing}
          userId={user?.id}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ArticleForm({ categories, initial, userId, onCancel, onSaved }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [categoryId, setCategoryId] = useState(initial?.category_id || categories[0]?.id || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price || "");
  const [support, setSupport] = useState(initial?.support || SUPPORTS[0]);
  const [dimensions, setDimensions] = useState(initial?.dimensions || "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.image_url || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!title.trim() || !categoryId) return;
    setBusy(true);
    setError("");
    try {
      let image_url = initial?.image_url || null;
      if (imageFile) {
        image_url = await uploadImage("article-images", imageFile, userId);
      }
      const payload = {
        title: title.trim(),
        category_id: categoryId,
        description,
        price: Number(price) || 0,
        support,
        dimensions,
        image_url,
      };
      if (initial) {
        const { error: err } = await supabase.from("articles").update(payload).eq("id", initial.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("articles").insert({ ...payload, published: false, views: 0 });
        if (err) throw err;
      }
      onSaved();
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onCancel}>
      <div className="font-semibold text-lg mb-4">{initial ? "Modifier l'article" : "Nouvel article"}</div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Catégorie</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Support</label>
            <select value={support} onChange={(e) => setSupport(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1">
              {SUPPORTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Dimensions</label>
            <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="ex : 3m x 2m" className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Prix (€)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Image</label>
          <div className="flex items-center gap-3 mt-1">
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} className="w-16 h-16 object-cover rounded-md border border-gray-200" alt="" />
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
