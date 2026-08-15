import { supabase } from "./supabaseClient";

export function fmtPrice(n) {
  return Number(n || 0).toLocaleString("fr-FR") + " Frs CFA";
}

export function fmtDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Redimensionne une image côté navigateur avant envoi (fichier plus léger)
export function resizeImage(file, maxSize = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Envoie une image redimensionnée vers un bucket Supabase Storage et
// renvoie son URL publique
export async function uploadImage(bucket, file, pathPrefix) {
  const blob = await resizeImage(file);
  const path = `${pathPrefix}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Envoie une courte vidéo (fichier brut, pas de compression) vers Supabase
// Storage et renvoie son URL publique. Limite la taille pour rester
// raisonnable (30 Mo par défaut — largement suffisant pour une courte
// présentation produit).
export async function uploadVideo(file, pathPrefix, maxSizeMb = 30) {
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`Vidéo trop lourde (max ${maxSizeMb} Mo).`);
  }
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${pathPrefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("article-videos").upload(path, file, {
    contentType: file.type || "video/mp4",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("article-videos").getPublicUrl(path);
  return data.publicUrl;
}
