"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Parcelamento } from "@/lib/financeiro-types";

function toDb(p: Parcelamento) {
  return {
    id: p.id,
    cartao_id: p.cartaoId,
    descricao: p.descricao,
    categoria: p.categoria,
    valor_total: p.valorTotal,
    total_parcelas: p.totalParcelas,
    mes_inicio: p.mesInicio,
    valor_parcela: p.valorParcela,
  };
}

function fromDb(row: Record<string, unknown>): Parcelamento {
  return {
    id: row.id as string,
    cartaoId: row.cartao_id as string,
    descricao: row.descricao as string,
    categoria: row.categoria as string,
    valorTotal: row.valor_total as number,
    totalParcelas: row.total_parcelas as number,
    mesInicio: row.mes_inicio as number,
    valorParcela: row.valor_parcela as number,
  };
}

export function useParcelamentos() {
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("parcelamentos")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useParcelamentos:", error);
        setParcelamentos((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, []);

  async function add(p: Parcelamento) {
    setParcelamentos(prev => [...prev, p]);
    const { error } = await supabase.from("parcelamentos").insert(toDb(p));
    if (error) console.error("add parcelamento:", error);
  }

  async function update(p: Parcelamento) {
    setParcelamentos(prev => prev.map(x => x.id === p.id ? p : x));
    const { error } = await supabase.from("parcelamentos").update(toDb(p)).eq("id", p.id);
    if (error) console.error("update parcelamento:", error);
  }

  async function remove(id: string) {
    setParcelamentos(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from("parcelamentos").delete().eq("id", id);
    if (error) console.error("remove parcelamento:", error);
  }

  return { parcelamentos, loading, add, update, remove };
}
