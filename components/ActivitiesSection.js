"use client";

import { Layers, Scissors, Wrench, Printer, GraduationCap } from "lucide-react";

const ACTIVITIES = [
  {
    icon: Layers,
    title: "Supports d'impression",
    text: "Bâches, vinyle, dos bleu et bien plus — des matériaux de qualité pour tous vos projets grand format.",
  },
  {
    icon: Scissors,
    title: "Matériaux de découpe",
    text: "Forex, plexi, alucobond, et autres supports rigides pour vos découpes précises et vos réalisations sur-mesure.",
  },
  {
    icon: Wrench,
    title: "Pièces détachées",
    text: "Une large gamme de pièces pour tous types de machines d'imprimerie — gardez votre atelier opérationnel, sans temps mort.",
  },
  {
    icon: Printer,
    title: "Machines professionnelles",
    text: "Imprimantes, CNC, machines laser, plotters… des équipements fiables pour donner vie à vos projets, du plus simple au plus exigeant.",
  },
  {
    icon: GraduationCap,
    title: "Installation & formation",
    text: "Nos équipes installent vos machines et forment vos machinistes, pour une prise en main rapide et une production efficace dès le premier jour.",
  },
];

export default function ActivitiesSection() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-semibold text-xl mb-1">Nos activités</h2>
        <p className="text-sm text-gray-500 mb-6">Tout ce qu'il faut pour équiper et faire tourner votre atelier.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ACTIVITIES.map((a) => (
            <div key={a.title} className="border border-gray-200 rounded-lg p-4">
              <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center mb-3">
                <a.icon size={18} className="text-blue-600" />
              </div>
              <div className="font-medium text-sm mb-1">{a.title}</div>
              <p className="text-xs text-gray-500 leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
