"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Entrada } from "@/lib/financeiro-types";

function toDb(e: Entrada, userId: string) {
  return { id: e.id, descricao: e.descricao, valor: e.valor, data: e.data, categoria: e.categoria, conta_id: e.contaId, user_id: userId };
}

function fromDb(row: Record<string, unknown>): Entrada {
  return { id: row.id as string, descricao: row.descricao as string, valor: row.valor as number, data: row.data as string, categoria: row.categoria as string, contaId: row.conta_id as string };
}

export function useEntradas(userId: string | null) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase.from("entradas").select("*").order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("useEntradas:", error);
        setEntradas((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, [userId]);

  async function add(e: Entrada) {
    if (!userId) return;
    setEntradas(prev => [...prev, e]);
    await supabase.from("entradas").insert(toDb(e, userId));
  }

  async function remove(id: string) {
    setEntradas(prev => prev.filter(e => e.id !== id));
    await supabase.from("entradas").delete().eq("id", id);
  }

  return { entradas, loading, add, remove };
}
