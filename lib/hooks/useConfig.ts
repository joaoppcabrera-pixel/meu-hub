"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ContaBancaria, CategoriaConfig, TipoContaBancaria, CATEGORIAS_DEFAULT } from "@/lib/config-store";

function contaToDb(c: ContaBancaria, userId: string) {
  return { id: c.id, banco_id: c.bancoId, nome: c.nome, tipo: c.tipo, saldo_inicial: c.saldoInicial, limite: c.limite ?? null, dia_fechamento: c.diaFechamento ?? null, dia_vencimento: c.diaVencimento ?? null, user_id: userId };
}

function contaFromDb(row: Record<string, unknown>): ContaBancaria {
  return { id: row.id as string, bancoId: row.banco_id as string, nome: row.nome as string, tipo: row.tipo as TipoContaBancaria, saldoInicial: row.saldo_inicial as number, limite: (row.limite as number) ?? undefined, diaFechamento: (row.dia_fechamento as number) ?? undefined, diaVencimento: (row.dia_vencimento as number) ?? undefined };
}

function catToDb(c: CategoriaConfig, userId: string) {
  return { id: c.id, nome: c.nome, cor: c.cor, user_id: userId };
}

function catFromDb(row: Record<string, unknown>): CategoriaConfig {
  return { id: row.id as string, nome: row.nome as string, cor: row.cor as string };
}

export function useConfig(userId: string | null) {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      supabase.from("contas_bancarias").select("*").order("created_at"),
      supabase.from("categorias").select("*").order("created_at"),
    ]).then(([{ data: cd }, { data: catd }]) => {
      setContas((cd ?? []).map(contaFromDb));
      const cats = catd ?? [];
      if (cats.length === 0) {
        supabase.from("categorias").insert(CATEGORIAS_DEFAULT.map(c => catToDb(c, userId))).then(() => {
          setCategorias(CATEGORIAS_DEFAULT);
        });
      } else {
        setCategorias(cats.map(catFromDb));
      }
      setLoading(false);
    });
  }, [userId]);

  async function addConta(c: ContaBancaria) {
    if (!userId) return;
    setContas(prev => [...prev, c]);
    await supabase.from("contas_bancarias").insert(contaToDb(c, userId));
  }
  async function updateConta(c: ContaBancaria) {
    setContas(prev => prev.map(x => x.id === c.id ? c : x));
    await supabase.from("contas_bancarias").update(contaToDb(c, userId ?? "")).eq("id", c.id);
  }
  async function removeConta(id: string) {
    setContas(prev => prev.filter(c => c.id !== id));
    await supabase.from("contas_bancarias").delete().eq("id", id);
  }

  async function addCategoria(c: CategoriaConfig) {
    if (!userId) return;
    setCategorias(prev => [...prev, c]);
    await supabase.from("categorias").insert(catToDb(c, userId));
  }
  async function updateCategoria(c: CategoriaConfig) {
    setCategorias(prev => prev.map(x => x.id === c.id ? c : x));
    await supabase.from("categorias").update(catToDb(c, userId ?? "")).eq("id", c.id);
  }
  async function removeCategoria(id: string) {
    setCategorias(prev => prev.filter(c => c.id !== id));
    await supabase.from("categorias").delete().eq("id", id);
  }

  return { contas, addConta, updateConta, removeConta, categorias, addCategoria, updateCategoria, removeCategoria, loading };
}
