"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Entrada } from "@/lib/financeiro-types";

function toDb(e: Entrada) {
  return {
    id: e.id,
    descricao: e.descricao,
    valor: e.valor,
    data: e.data,
    categoria: e.categoria,
    conta_id: e.contaId,
  };
}

function fromDb(row: Record<string, unknown>): Entrada {
  return {
    id: row.id as string,
    descricao: row.descricao as string,
    valor: row.valor as number,
    data: row.data as string,
    categoria: row.categoria as string,
    contaId: row.conta_id as string,
  };
}

export function useEntradas() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("entradas")
      .select("*")
      .order("data", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("useEntradas:", error);
        setEntradas((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, []);

  async function add(entrada: Entrada) {
    setEntradas(prev => [...prev, entrada]);
    const { error } = await supabase.from("entradas").insert(toDb(entrada));
    if (error) console.error("add entrada:", error);
  }

  async function remove(id: string) {
    setEntradas(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from("entradas").delete().eq("id", id);
    if (error) console.error("remove entrada:", error);
  }

  return { entradas, loading, add, remove };
}
