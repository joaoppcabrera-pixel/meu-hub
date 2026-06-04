"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Assinatura } from "@/lib/financeiro-types";

function toDb(a: Assinatura, userId: string) {
  return { id: a.id, cartao_id: a.cartaoId, descricao: a.descricao, categoria: a.categoria, valor: a.valor, dia_cobranca: a.diaCobranca, mes_inicio: a.mesInicio, mes_fim: a.mesFim ?? null, ativa: a.ativa, user_id: userId };
}

function fromDb(row: Record<string, unknown>): Assinatura {
  return { id: row.id as string, cartaoId: row.cartao_id as string, descricao: row.descricao as string, categoria: row.categoria as string, valor: row.valor as number, diaCobranca: row.dia_cobranca as number, mesInicio: row.mes_inicio as number, mesFim: (row.mes_fim as number) ?? undefined, ativa: row.ativa as boolean };
}

export function useAssinaturas(userId: string | null) {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase.from("assinaturas").select("*").order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useAssinaturas:", error);
        setAssinaturas((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, [userId]);

  async function add(a: Assinatura) {
    if (!userId) return;
    setAssinaturas(prev => [...prev, a]);
    await supabase.from("assinaturas").insert(toDb(a, userId));
  }

  async function update(a: Assinatura) {
    setAssinaturas(prev => prev.map(x => x.id === a.id ? a : x));
    await supabase.from("assinaturas").update(toDb(a, userId ?? "")).eq("id", a.id);
  }

  async function remove(id: string) {
    setAssinaturas(prev => prev.filter(a => a.id !== id));
    await supabase.from("assinaturas").delete().eq("id", id);
  }

  async function cancelar(id: string) {
    const mesAtual = new Date().getMonth();
    const a = assinaturas.find(x => x.id === id);
    if (!a) return;
    await update({ ...a, ativa: false, mesFim: mesAtual });
  }

  return { assinaturas, loading, add, update, remove, cancelar };
}
