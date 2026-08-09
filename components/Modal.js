"use client";

import { X } from "lucide-react";

export default function Modal({ children, onClose, wide }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto p-5 relative rounded-lg shadow-xl`}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
