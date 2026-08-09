"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { uploadImage } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfilPage() {
  const { user, profile, loading, refreshProfile, openAuth } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setNom(profile.nom || "");
      setPrenom(profile.prenom || "");
      setDateNaissance(profile.date_naissance || "");
      setTelephone(profile.telephone || "");
      setPhotoPreview(profile.photo_url || null);
    }
  }, [profile]);

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function save() {
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      let photo_url = profile?.photo_url || null;
      if (photoFile) {
        photo_url = await uploadImage("avatars", photoFile, user.id);
      }
      const { error: err } = await supabase
        .from("profiles")
        .update({
          nom: nom.trim(),
          prenom: prenom.trim(),
          date_naissance: dateNaissance,
          telephone: telephone.trim(),
          photo_url,
        })
        .eq("id", user.id);
      if (err) throw err;
      await refreshProfile();
      setPhotoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
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
          <div className="font-semibold text-lg mb-2">Mon profil</div>
          <p className="text-sm text-gray-500 mb-4">Connectez-vous pour voir et modifier votre profil.</p>
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
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
          ← Retour à la boutique
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="font-semibold text-lg mb-4">Mon profil</div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300 text-2xl">
                  {prenom?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <label className="text-sm border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex items-center gap-1.5 hover:bg-gray-50">
              <Upload size={14} /> Changer la photo
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Nom</label>
                <input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Prénom(s)</label>
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Date de naissance</label>
              <input type="date" value={dateNaissance || ""} onChange={(e) => setDateNaissance(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Numéro de téléphone</label>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">E-mail (connexion)</label>
              <input value={user.email} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-md p-2 text-sm mt-1" />
            </div>

            {error && <div className="text-xs text-red-600">{error}</div>}

            <button
              onClick={save}
              disabled={busy}
              className="w-full text-sm px-3 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
              {busy ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
