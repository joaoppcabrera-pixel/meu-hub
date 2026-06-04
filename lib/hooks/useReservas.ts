"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Reserva, TipoReserva } from "@/lib/financeiro-types";

function toDb(r: Reserva, userId: string) {
  return { id: r.id, nome: r.nome, tipo: r.tipo, saldo_atual: r.saldoAtual, meta: r.meta ?? null, aportes: r.aportes, aportes_contas: r.aportesContas ?? {}, user_id: userId };
}

function fromDb(row: Record<string, unknown>): Reserva {
  return { id: row.id as string, nome: row.nome as string, tipo: row.tipo as TipoReserva, saldoAtual: row.saldo_atual as number, meta: (row.meta as number) ?? undefined, aportes: (row.aportes as Record<string, number>) ?? {}, aportesContas: (row.aportes_contas as Record<string, string>) ?? {} };
}

export function useReservas(userId: string | null) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase.from("reservas").select("*").order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("useReservas:", error);
        setReservas((data ?? []).map(fromDb));
        setLoading(false);
      });
  }, [userId]);

  async function add(r: Reserva) {
    if (!userId) return;
    setReservas(prev => [...prev, r]);
    await supabase.from("reservas").insert(toDb(r, userId));
  }

  async function update(r: Reserva) {
    setReservas(prev => prev.map(x => x.id === r.id ? r : x));
    await supabase.from("reservas").update(toDb(r, userId ?? "")).eq("id", r.id);
  }

  async function remove(id: string) {
    setReservas(prev => prev.filter(r => r.id !== id));
    await supabase.from("reservas").delete().eq("id", id);
  }

  return { reservas, loading, add, update, remove };
}
