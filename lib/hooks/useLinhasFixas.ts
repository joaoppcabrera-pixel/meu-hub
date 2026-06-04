"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { LinhaFinanceira } from "@/lib/financeiro-data";

function toDb(l: LinhaFinanceira) {
  return {
    id: l.id,
    nome: l.nome,
    categoria: l.categoria ?? null,
    dia_vencimento: l.diaVencimento ?? null,
    valores: l.valores,
    pagos: l.pagos,
    pagos_contas: l.pagosContas ?? {},
    cartao_vinculado_id: l.cartaoVinculadoId ?? null,
  };
}

function fromDb(row: Record<string, unknown>): LinhaFinanceira {
  return {
    id: row.id as string,
    nome: row.nome as string,
    tipo: "gasto",
    categoria: (row.categoria as string) ?? undefined,
    diaVencimento: (row.dia_vencimento as number) ?? undefined,
    valores: (row.valores as Record<string, number>) ?? {},
    pagos: (row.pagos as Record<string, boolean>) ?? {},
    pagosContas: (row.pagos_contas as Record<string, string>) ?? {},
    cartaoVinculadoId: (row.cartao_vinculado_id as string) ?? undefined,
  };
}

export function useLinhasFixas() {
  const [linhas, setLinhasState] = useState<LinhaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<LinhaFinanceira[]>([]);

  useEffect(() => {
    supabase
      .from("linhas_fixas")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useLinhasFixas:", error);
        const parsed = (data ?? []).map(fromDb);
        ref.current = parsed;
        setLinhasState(parsed);
        setLoading(false);
      });
  }, []);

  // Recebe o array completo, faz diff e sincroniza só o que mudou
  const setLinhas = useCallback(async (newLinhas: LinhaFinanceira[]) => {
    const old = ref.current;
    ref.current = newLinhas;
    setLinhasState(newLinhas);

    const added   = newLinhas.filter(n => !old.find(o => o.id === n.id));
    const removed = old.filter(o => !newLinhas.find(n => n.id === o.id));
    const updated = newLinhas.filter(n => {
      const o = old.find(x => x.id === n.id);
      return o && JSON.stringify(o) !== JSON.stringify(n);
    });

    await Promise.all([
      ...added.map(l => supabase.from("linhas_fixas").insert(toDb(l))),
      ...removed.map(l => supabase.from("linhas_fixas").delete().eq("id", l.id)),
      ...updated.map(l => supabase.from("linhas_fixas").update(toDb(l)).eq("id", l.id)),
    ]);
  }, []);

  return { linhas, setLinhas, loading };
}
