"use client";

import Link from "next/link";
import { Star, ImageOff } from "lucide-react";
import { fmtPrice } from "@/lib/helpers";

export default function ArticleCard({ article, highlight }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all block"
    >
      <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={28} className="text-gray-300" />
        )}
        {highlight && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Populaire
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium text-sm">{article.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {article.support} · {article.dimensions}
        </div>
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
