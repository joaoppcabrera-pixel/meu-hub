"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Assinatura } from "@/lib/financeiro-types";

function toDb(a: Assinatura) {
  return {
    id: a.id,
    cartao_id: a.cartaoId,
    descricao: a.descricao,
    categoria: a.categoria,
    valor: a.valor,
    dia_cobranca: a.diaCobranca,
    mes_inicio: a.mesInicio,
    mes_fim: a.mesFim ?? null,
    ativa: a.ativa,
  };
}

function fromDb(row: Record<string, unknown>): Assinatura {
  return {
    id: row.id as string,
    cartaoId: row.cartao_id as string,
    descricao: row.descricao as string,
    categoria: row.categoria as string,
    valor: row.valor as number,
    diaCobranca: row.dia_cobranca as number,
    mesInicio: row.mes_inicio as number,
    mesFim: (row.mes_fim as number) ?? undefined,
    ativa: row.ativa as boolean,
  };
}

export function useAssinaturas() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("assinaturas")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useAssinaturas:", error);
        setAssinaturas((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, []);

  async function add(a: Assinatura) {
    setAssinaturas((prev) => [...prev, a]);
    await supabase.from("assinaturas").insert(toDb(a));
  }

  async function update(a: Assinatura) {
    setAssinaturas((prev) => prev.map((x) => (x.id === a.id ? a : x)));
    await supabase.from("assinaturas").update(toDb(a)).eq("id", a.id);
  }

  async function remove(id: string) {
    setAssinaturas((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("assinaturas").delete().eq("id", id);
  }

  // Cancelar: define mesFim como o mês atual e ativa=false
  async function cancelar(id: string) {
    const mesAtual = new Date().getMonth();
    const updated = assinaturas.find((a) => a.id === id);
    if (!updated) return;
    const cancelada = { ...updated, ativa: false, mesFim: mesAtual };
    await update(cancelada);
  }

  return { assinaturas, loading, add, update, remove, cancelar };
}
