"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Parcelamento } from "@/lib/financeiro-types";

function toDb(p: Parcelamento, userId: string) {
  return { id: p.id, cartao_id: p.cartaoId, descricao: p.descricao, categoria: p.categoria, valor_total: p.valorTotal, total_parcelas: p.totalParcelas, mes_inicio: p.mesInicio, valor_parcela: p.valorParcela, user_id: userId };
}

function fromDb(row: Record<string, unknown>): Parcelamento {
  return { id: row.id as string, cartaoId: row.cartao_id as string, descricao: row.descricao as string, categoria: row.categoria as string, valorTotal: row.valor_total as number, totalParcelas: row.total_parcelas as number, mesInicio: row.mes_inicio as number, valorParcela: row.valor_parcela as number };
}

export function useParcelamentos(userId: string | null) {
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase.from("parcelamentos").select("*").order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useParcelamentos:", error);
        setParcelamentos((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, [userId]);

  async function add(p: Parcelamento) {
    if (!userId) return;
    setParcelamentos(prev => [...prev, p]);
    await supabase.from("parcelamentos").insert(toDb(p, userId));
  }

  async function update(p: Parcelamento) {
    setParcelamentos(prev => prev.map(x => x.id === p.id ? p : x));
    await supabase.from("parcelamentos").update(toDb(p, userId ?? "")).eq("id", p.id);
  }

  async function remove(id: string) {
    setParcelamentos(prev => prev.filter(p => p.id !== id));
    await supabase.from("parcelamentos").delete().eq("id", id);
  }

  return { parcelamentos, loading, add, update, remove };
}
