"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSaudePerfil } from "@/lib/hooks/useSaudePerfil";
import { Heart, Loader2 } from "lucide-react";

export default function Saude() {
  const { user } = useAuth();
  const { perfil, loading } = useSaudePerfil(user?.id ?? null);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!perfil || !perfil.configurado) {
      router.replace("/saude/configuracao");
    }
  }, [perfil, loading, router]);

  if (loading || !perfil?.configurado) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  // Placeholder — será expandido com as abas do módulo
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 bg-rose-600/20 rounded-xl">
          <Heart size={22} className="text-rose-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Saúde</h2>
          <p className="text-gray-400 text-sm mt-0.5">Telemetria, dieta e composição corporal</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Meta Calórica</p>
          <p className="text-2xl font-bold text-white">{perfil.meta_calorias.toLocaleString()}</p>
          <p className="text-xs text-gray-600">kcal/dia</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-blue-400 mb-1">Proteína</p>
          <p className="text-2xl font-bold text-white">{perfil.meta_proteina_g}g</p>
          <p className="text-xs text-gray-600">{Math.round(perfil.meta_proteina_g * 4)} kcal</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-amber-400 mb-1">Carboidrato</p>
          <p className="text-2xl font-bold text-white">{perfil.meta_carboidrato_g}g</p>
          <p className="text-xs text-gray-600">{Math.round(perfil.meta_carboidrato_g * 4)} kcal</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-rose-400 mb-1">Gordura</p>
          <p className="text-2xl font-bold text-white">{perfil.meta_gordura_g}g</p>
          <p className="text-xs text-gray-600">{Math.round(perfil.meta_gordura_g * 9)} kcal</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <Heart size={32} className="text-gray-700 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Módulo em desenvolvimento</p>
        <p className="text-gray-600 text-sm mt-1">As abas de dieta, telemetria e medidas estarão disponíveis em breve.</p>
      </div>
    </div>
  );
}
