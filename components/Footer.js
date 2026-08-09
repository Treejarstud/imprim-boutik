"use client";

import Link from "next/link";

export default function Footer({ categories = [] }) {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <div className="text-white font-semibold text-lg mb-2">Imprim Boutik</div>
          <p className="text-sm text-gray-400">
            La boutique des imprimeurs — impression numérique grand format : bâches, vinyles, toiles et
            panneaux rigides, imprimés sur mesure.
          </p>
        </div>
        <div>
          <div className="text-white font-medium text-sm mb-2">Catégories</div>
          <ul className="text-sm space-y-1 text-gray-400">
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
            {categories.length === 0 && <li>À venir</li>}
          </ul>
        </div>
        <div>
          <div className="text-white font-medium text-sm mb-2">Contact</div>
          <p className="text-sm text-gray-400">Une question sur une commande ? Utilisez le chat en bas à droite de la boutique.</p>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center text-xs text-gray-500 py-4">
        © {new Date().getFullYear()} Imprim Boutik — tous droits réservés{" · "}
        <Link href="/vendeur" className="hover:text-gray-300 underline decoration-dotted">
          Espace professionnel
        </Link>
      </div>
    </footer>
  );
}
