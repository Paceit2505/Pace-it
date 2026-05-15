"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/treinos", label: "Treinos", icon: "💪" },
  { href: "/sono", label: "Sono", icon: "😴" },
  { href: "/exames", label: "Exames de Sangue", icon: "🩸" },
  { href: "/bioimpedancia", label: "Bioimpedância", icon: "⚖️" },
  { href: "/medidas", label: "Medidas Corporais", icon: "📏" },
  { href: "/nutricao", label: "Nutrição & Hidratação", icon: "🥗" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">Pace-it Health</h1>
        <p className="text-xs text-gray-400 mt-0.5">Seu acompanhamento de saúde</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">Dados salvos localmente</p>
      </div>
    </aside>
  );
}
