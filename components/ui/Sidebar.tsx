"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, Heart, Settings, Shield, LogOut, X, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/financeiro", label: "Financeiro", icon: Wallet          },
  { href: "/saude",      label: "Saúde",      icon: Heart           },
];

interface Props {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAdmin, signOut } = useAuth();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="w-64 md:w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-3 h-full shrink-0">
      {/* Header com botão fechar no mobile */}
      <div className="mb-8 px-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Meu Hub</h1>
          <p className="text-xs text-gray-500 mt-1">Painel pessoal</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

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

      <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-1">
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin")
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Shield size={18} />
            Admin
          </Link>
        )}
        <Link
          href="/ajuda"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive("/ajuda")
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <HelpCircle size={18} />
          Ajuda
        </Link>
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

        <div className="mt-2 px-3 py-2 rounded-lg bg-gray-800/50">
          <p className="text-xs text-white font-medium truncate">{profile?.nome ?? profile?.email ?? "Usuário"}</p>
          <p className="text-xs text-gray-500 capitalize">{profile?.role === "admin" ? "Administrador" : "Usuário"}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
