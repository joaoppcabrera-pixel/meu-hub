"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface PerfilSaude {
  id: string;
  user_id: string;
  data_nascimento: string;
  sexo: "masculino" | "feminino";
  altura_cm: number;
  peso_inicial_kg: number;
  cintura_cm: number | null;
  quadril_cm: number | null;
  braco_cm: number | null;
  coxa_cm: number | null;
  restricoes_alimentares: string[];
  nivel_atividade: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
  rotina_descrita: string | null;
  tmb_kcal: number;
  tdee_kcal: number;
  objetivo_texto: string;
  objetivo_tipo: string | null;
  objetivo_interpretado: Record<string, unknown> | null;
  plano_tipo: "conservador" | "normal" | "agressivo" | null;
  meta_calorias: number;
  meta_proteina_g: number;
  meta_carboidrato_g: number;
  meta_gordura_g: number;
  configurado: boolean;
  anthropic_api_key?: string | null;
}

export function useSaudePerfil(userId: string | null) {
  const [perfil, setPerfil] = useState<PerfilSaude | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from("perfil_saude")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setPerfil(data ?? null);
        setLoading(false);
      });
  }, [userId]);

  async function salvarPerfil(dados: Partial<PerfilSaude>) {
    if (!userId) return;
    const payload = { ...dados, user_id: userId, updated_at: new Date().toISOString() };
    const { data } = await supabase
      .from("perfil_saude")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (data) setPerfil(data);
    return data;
  }

  return { perfil, loading, salvarPerfil };
}
