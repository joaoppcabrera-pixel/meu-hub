"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Reserva, TipoReserva } from "@/lib/financeiro-types";

function toDb(r: Reserva) {
  return {
    id: r.id,
    nome: r.nome,
    tipo: r.tipo,
    saldo_atual: r.saldoAtual,
    meta: r.meta ?? null,
    aportes: r.aportes,
  };
}

function fromDb(row: Record<string, unknown>): Reserva {
  return {
    id: row.id as string,
    nome: row.nome as string,
    tipo: row.tipo as TipoReserva,
    saldoAtual: row.saldo_atual as number,
    meta: (row.meta as number) ?? undefined,
    aportes: (row.aportes as Record<string, number>) ?? {},
  };
}

export function useReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("reservas")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useReservas:", error);
        setReservas((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, []);

  async function add(r: Reserva) {
    setReservas(prev => [...prev, r]);
    const { error } = await supabase.from("reservas").insert(toDb(r));
    if (error) console.error("add reserva:", error);
  }

  async function update(r: Reserva) {
    setReservas(prev => prev.map(x => x.id === r.id ? r : x));
    const { error } = await supabase.from("reservas").update(toDb(r)).eq("id", r.id);
    if (error) console.error("update reserva:", error);
  }

  async function remove(id: string) {
    setReservas(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) console.error("remove reserva:", error);
  }

  return { reservas, loading, add, update, remove };
}
