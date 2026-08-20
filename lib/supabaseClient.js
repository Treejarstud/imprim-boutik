import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variables Supabase manquantes. Copiez .env.local.example vers .env.local et remplissez-le."
  );
}

// Valeurs de secours : si une variable manque au moment de la compilation
// (ex: mauvaise configuration sur Vercel), on évite de faire planter tout
// le site — seules les fonctions qui appellent réellement Supabase
// échoueront, au lieu de bloquer la mise en ligne de l'ensemble.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
