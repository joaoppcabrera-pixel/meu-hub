"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GastoVariavel, MeioPagamento } from "@/lib/financeiro-types";

function toDb(g: GastoVariavel, userId: string) {
  return { id: g.id, descricao: g.descricao, valor: g.valor, data: g.data, categoria: g.categoria, meio: g.meio, cartao_id: g.cartaoId ?? null, conta_id: g.contaId ?? null, user_id: userId };
}

function fromDb(row: Record<string, unknown>): GastoVariavel {
  return { id: row.id as string, descricao: row.descricao as string, valor: row.valor as number, data: row.data as string, categoria: row.categoria as string, meio: row.meio as MeioPagamento, cartaoId: (row.cartao_id as string) ?? undefined, contaId: (row.conta_id as string) ?? undefined };
}

export function useGastosVariaveis(userId: string | null) {
  const [gastos, setGastos] = useState<GastoVariavel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase.from("gastos_variaveis").select("*").order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("useGastosVariaveis:", error);
        setGastos((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, [userId]);

  async function add(g: GastoVariavel) {
    if (!userId) return;
    setGastos(prev => [...prev, g]);
    await supabase.from("gastos_variaveis").insert(toDb(g, userId));
  }

  async function update(g: GastoVariavel) {
    setGastos(prev => prev.map(x => x.id === g.id ? g : x));
    await supabase.from("gastos_variaveis").update(toDb(g, userId ?? "")).eq("id", g.id);
  }

  async function remove(id: string) {
    setGastos(prev => prev.filter(g => g.id !== id));
    await supabase.from("gastos_variaveis").delete().eq("id", id);
  }

  return { gastos, loading, add, update, remove };
}
