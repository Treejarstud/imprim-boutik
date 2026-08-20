"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <PackageSearch size={28} className="text-blue-600" />
        </div>
        <div className="font-bold text-2xl mb-2">Page introuvable</div>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Cette page n'existe pas ou a été déplacée. Vérifiez l'adresse, ou retournez à la boutique.
        </p>
        <Link href="/" className="inline-block text-sm px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
