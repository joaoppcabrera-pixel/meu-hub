"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/ui/Sidebar";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) router.replace("/login");
    if (user && isLoginPage) router.replace("/");
  }, [user, loading, isLoginPage]);

  // Tela de loading enquanto verifica sessão
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Página de login sem layout
  if (isLoginPage) return <>{children}</>;

  // Páginas autenticadas com sidebar
  if (!user) return null;

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
