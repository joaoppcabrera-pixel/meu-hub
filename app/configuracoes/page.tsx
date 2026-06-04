"use client";

import { useState } from "react";
import { useConfig } from "@/lib/hooks/useConfig";
import { useAuth } from "@/lib/auth-context";
import ContasBancariasSection from "@/components/configuracoes/ContasBancariasSection";
import CategoriasSection from "@/components/configuracoes/CategoriasSection";
import { Wallet, Loader2 } from "lucide-react";

type ModuloConfig = "financeiro";

const MODULOS: { id: ModuloConfig; label: string; icon: React.ReactNode }[] = [
  { id: "financeiro", label: "Financeiro", icon: <Wallet size={16} /> },
];

export default function Configuracoes() {
  const [modulo, setModulo] = useState<ModuloConfig>("financeiro");
  const { user } = useAuth();
  const {
    contas, addConta, updateConta, removeConta,
    categorias, addCategoria, updateCategoria, removeCategoria,
    loading,
  } = useConfig(user?.id ?? null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>
        <p className="text-gray-400 mt-1">Cadastros e personalizações do sistema</p>
      </div>

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 mb-8 w-fit">
        {MODULOS.map(m => (
          <button
            key={m.id}
            onClick={() => setModulo(m.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              modulo === m.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Carregando configurações...</span>
        </div>
      ) : modulo === "financeiro" && (
        <div className="flex flex-col gap-10">
          <ContasBancariasSection
            contas={contas} onAdd={addConta} onUpdate={updateConta} onRemove={removeConta}
          />
          <div className="border-t border-gray-800" />
          <CategoriasSection
            categorias={categorias} onAdd={addCategoria} onUpdate={updateCategoria} onRemove={removeCategoria}
          />
        </div>
      )}
    </div>
  );
}
