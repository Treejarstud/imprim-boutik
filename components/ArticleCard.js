"use client";

import Link from "next/link";
import { Star, ImageOff, Video, Heart } from "lucide-react";
import { fmtPrice } from "@/lib/helpers";

export default function ArticleCard({ article, highlight, isFavorite, onToggleFavorite }) {
  const outOfStock = article.stock !== undefined && article.stock !== null && article.stock <= 0;

  return (
    <Link
      href={`/article/${article.id}`}
      className="text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all block"
    >
      <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.image_url} alt={article.title} className={`w-full h-full object-cover ${outOfStock ? "opacity-50" : ""}`} />
        ) : (
          <ImageOff size={28} className="text-gray-300" />
        )}
        {highlight && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Populaire
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Rupture de stock
          </span>
        )}
        {article.video_url && (
          <span className="absolute top-2 right-9 bg-black/60 text-white p-1 rounded-full" title="Vidéo disponible">
            <Video size={12} />
          </span>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(article);
            }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart size={14} fill={isFavorite ? "#EF4444" : "none"} stroke={isFavorite ? "#EF4444" : "#4B5563"} />
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium text-sm">{article.title}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-sm">{fmtPrice(article.price)}</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={12} fill={article.avg_rating ? "#FBBF24" : "none"} stroke="#FBBF24" />
            {article.avg_rating ? Number(article.avg_rating).toFixed(1) : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
