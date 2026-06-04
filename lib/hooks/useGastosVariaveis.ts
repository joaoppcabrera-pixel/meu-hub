"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GastoVariavel, MeioPagamento } from "@/lib/financeiro-types";

function toDb(g: GastoVariavel) {
  return {
    id: g.id,
    descricao: g.descricao,
    valor: g.valor,
    data: g.data,
    categoria: g.categoria,
    meio: g.meio,
    cartao_id: g.cartaoId ?? null,
    conta_id: g.contaId ?? null,
  };
}

function fromDb(row: Record<string, unknown>): GastoVariavel {
  return {
    id: row.id as string,
    descricao: row.descricao as string,
    valor: row.valor as number,
    data: row.data as string,
    categoria: row.categoria as string,
    meio: row.meio as MeioPagamento,
    cartaoId: (row.cartao_id as string) ?? undefined,
    contaId: (row.conta_id as string) ?? undefined,
  };
}

export function useGastosVariaveis() {
  const [gastos, setGastos] = useState<GastoVariavel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("gastos_variaveis")
      .select("*")
      .order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("useGastosVariaveis:", error);
        setGastos((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, []);

  async function add(g: GastoVariavel) {
    setGastos(prev => [...prev, g]);
    const { error } = await supabase.from("gastos_variaveis").insert(toDb(g));
    if (error) console.error("add gasto:", error);
  }

  async function remove(id: string) {
    setGastos(prev => prev.filter(g => g.id !== id));
    const { error } = await supabase.from("gastos_variaveis").delete().eq("id", id);
    if (error) console.error("remove gasto:", error);
  }

  return { gastos, loading, add, remove };
}
