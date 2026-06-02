"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Dumbbell, Apple, Settings } from "lucide-react";

const navItems = [
  { href: "/",              label: "Dashboard",   icon: LayoutDashboard },
  { href: "/financeiro",    label: "Financeiro",  icon: Wallet          },
  { href: "/treinos",       label: "Treinos",     icon: Dumbbell        },
  { href: "/dieta",         label: "Dieta",       icon: Apple           },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-3 shrink-0">
      <div className="mb-8 px-3">
        <h1 className="text-xl font-bold text-white">Meu Hub</h1>
        <p className="text-xs text-gray-500 mt-1">Painel pessoal</p>
      </div>

      {/* Navegação principal */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Configurações no rodapé */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <Link
          href="/configuracoes"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive("/configuracoes")
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <Settings size={18} />
          Configurações
        </Link>
      </div>
    </aside>
  );
}
