"use client";

import { useState, useEffect } from "react";

// ── TIPOS ─────────────────────────────────────────────────

export type TipoContaBancaria = "corrente" | "cartao" | "investimento";

export interface ContaBancaria {
  id: string;
  bancoId: string;
  nome: string;
  tipo: TipoContaBancaria;
  saldoInicial: number;
  // cartão
  limite?: number;
  diaFechamento?: number;
  diaVencimento?: number;
}

export interface CategoriaConfig {
  id: string;
  nome: string;
  cor: string; // ex: "purple", "blue", "red"
}

export interface FinanceiroConfig {
  contas: ContaBancaria[];
  categorias: CategoriaConfig[];
}

// ── CORES DISPONÍVEIS ─────────────────────────────────────

export const CORES_CATEGORIA: { id: string; label: string; bg: string; text: string; chip: string }[] = [
  { id: "blue",    label: "Azul",    bg: "bg-blue-500/15",    text: "text-blue-400",    chip: "bg-blue-500"    },
  { id: "red",     label: "Vermelho",bg: "bg-red-500/15",     text: "text-red-400",     chip: "bg-red-500"     },
  { id: "emerald", label: "Verde",   bg: "bg-emerald-500/15", text: "text-emerald-400", chip: "bg-emerald-500" },
  { id: "yellow",  label: "Amarelo", bg: "bg-yellow-500/15",  text: "text-yellow-400",  chip: "bg-yellow-500"  },
  { id: "purple",  label: "Roxo",    bg: "bg-purple-500/15",  text: "text-purple-400",  chip: "bg-purple-500"  },
  { id: "orange",  label: "Laranja", bg: "bg-orange-500/15",  text: "text-orange-400",  chip: "bg-orange-500"  },
  { id: "indigo",  label: "Índigo",  bg: "bg-indigo-500/15",  text: "text-indigo-400",  chip: "bg-indigo-500"  },
  { id: "pink",    label: "Rosa",    bg: "bg-pink-500/15",    text: "text-pink-400",    chip: "bg-pink-500"    },
  { id: "teal",    label: "Teal",    bg: "bg-teal-500/15",    text: "text-teal-400",    chip: "bg-teal-500"    },
  { id: "gray",    label: "Cinza",   bg: "bg-gray-500/15",    text: "text-gray-400",    chip: "bg-gray-500"    },
];

export function getCorCategoria(corId: string) {
  return CORES_CATEGORIA.find((c) => c.id === corId) ?? CORES_CATEGORIA[CORES_CATEGORIA.length - 1];
}

// ── CATEGORIAS PADRÃO ─────────────────────────────────────

export const CATEGORIAS_DEFAULT: CategoriaConfig[] = [
  { id: "moradia",       nome: "Moradia",       cor: "blue"    },
  { id: "impostos",      nome: "Impostos",      cor: "red"     },
  { id: "saude",         nome: "Saúde",         cor: "emerald" },
  { id: "servicos",      nome: "Serviços",      cor: "yellow"  },
  { id: "cartoes",       nome: "Cartões",       cor: "purple"  },
  { id: "dividas",       nome: "Dívidas",       cor: "orange"  },
  { id: "investimentos", nome: "Investimentos", cor: "indigo"  },
  { id: "alimentacao",   nome: "Alimentação",   cor: "teal"    },
  { id: "transporte",    nome: "Transporte",    cor: "yellow"  },
  { id: "lazer",         nome: "Lazer",         cor: "pink"    },
  { id: "outros",        nome: "Outros",        cor: "gray"    },
];

// ── HOOK localStorage ─────────────────────────────────────

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setState(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, [key]);

  function setValue(val: T | ((prev: T) => T)) {
    setState((prev) => {
      const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return [state, setValue];
}

// ── HOOK FINANCEIRO CONFIG ────────────────────────────────

export function useFinanceiroConfig() {
  const [contas, setContas] = useLocalStorage<ContaBancaria[]>("fin_contas", []);
  const [categorias, setCategorias] = useLocalStorage<CategoriaConfig[]>("fin_categorias", CATEGORIAS_DEFAULT);

  function addConta(c: ContaBancaria) { setContas((prev) => [...prev, c]); }
  function updateConta(c: ContaBancaria) { setContas((prev) => prev.map((x) => x.id === c.id ? c : x)); }
  function removeConta(id: string) { setContas((prev) => prev.filter((x) => x.id !== id)); }

  function addCategoria(c: CategoriaConfig) { setCategorias((prev) => [...prev, c]); }
  function updateCategoria(c: CategoriaConfig) { setCategorias((prev) => prev.map((x) => x.id === c.id ? c : x)); }
  function removeCategoria(id: string) { setCategorias((prev) => prev.filter((x) => x.id !== id)); }

  return {
    contas, addConta, updateConta, removeConta,
    categorias, addCategoria, updateCategoria, removeCategoria,
  };
}
