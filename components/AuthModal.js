"use client";

import { useState } from "react";
import { LogIn, UserPlus, Upload, MailCheck } from "lucide-react";
import Modal from "./Modal";
import { supabase } from "@/lib/supabaseClient";
import { uploadImage } from "@/lib/helpers";
import { useAuth, savePendingProfile } from "@/contexts/AuthContext";

export default function AuthModal() {
  const { authModal, closeAuth, refreshProfile } = useAuth();
  const [mode, setMode] = useState(authModal || "login");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  if (!authModal) return null;

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
        closeAuth();
      } else {
        if (!nom.trim() || !prenom.trim() || !dateNaissance || !telephone.trim() || !email.trim() || !password) {
          throw new Error("Merci de remplir tous les champs.");
        }
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;

        if (!data.session) {
          // La confirmation d'e-mail est active : le profil sera créé automatiquement
          // dès la première connexion, une fois l'e-mail confirmé (voir AuthContext).
          savePendingProfile(email.trim(), {
            nom: nom.trim(),
            prenom: prenom.trim(),
            date_naissance: dateNaissance,
            telephone: telephone.trim(),
            photo_url: null,
          });
          setPendingConfirmation(true);
          return;
        }

        let photo_url = null;
        if (photoFile) {
          photo_url = await uploadImage("avatars", photoFile, data.user.id);
        }
        const { error: profileErr } = await supabase.from("profiles").insert({
          id: data.user.id,
          nom: nom.trim(),
          prenom: prenom.trim(),
          date_naissance: dateNaissance,
          telephone: telephone.trim(),
          photo_url,
        });
        if (profileErr) throw profileErr;
        await refreshProfile();
        closeAuth();
      }
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <Modal onClose={closeAuth}>
        <div className="flex flex-col items-center text-center py-4">
          <MailCheck size={32} className="text-blue-600 mb-3" />
          <div className="font-semibold text-lg">Vérifiez votre boîte mail</div>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">
            Un e-mail de confirmation a été envoyé à <b>{email}</b>. Cliquez sur le lien qu'il contient, puis
            revenez vous connecter ici — votre profil sera complété automatiquement.
          </p>
          <button onClick={closeAuth} className="text-sm px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 mt-4">
            Fermer
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={closeAuth}>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("login")}
          className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-1 ${mode === "login" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          <LogIn size={14} /> Connexion
        </button>
        <button
          onClick={() => setMode("register")}
          className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-1 ${mode === "register" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          <UserPlus size={14} /> Inscription
        </button>
      </div>

      {mode === "register" && (
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
            <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Photo</label>
            <div className="flex items-center gap-3 mt-1">
              {photoPreview && <img src={photoPreview} className="w-12 h-12 object-cover rounded-full border border-gray-200" />}
              <label className="text-sm border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex items-center gap-1 hover:bg-gray-50">
                <Upload size={14} /> Choisir
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Numéro de téléphone</label>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">E-mail (sert à la connexion)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
        </div>
      )}

      {mode === "login" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1" />
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-600 mt-3">{error}</div>}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full text-sm px-3 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 mt-4"
      >
        {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
      </button>
    </Modal>
  );
}
