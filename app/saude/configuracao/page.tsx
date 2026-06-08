"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSaudePerfil } from "@/lib/hooks/useSaudePerfil";
import {
  User, Activity, Target, ChartBar,
  ChevronRight, ChevronLeft, Check, Loader2, Info, Sparkles, ZapOff,
  ExternalLink, Copy, CheckCircle, XCircle, Key, Zap, ArrowRight, AlertCircle,
} from "lucide-react";

// ── TIPOS ─────────────────────────────────────────────────────────────────────

type WizardFase = "escolha" | "setup_api" | "wizard";
type NivelAtividade = "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
type PlanoTipo = "conservador" | "normal" | "agressivo";

interface FormData {
  data_nascimento: string;
  sexo: "masculino" | "feminino" | "";
  altura_cm: string;
  peso_inicial_kg: string;
  cintura_cm: string;
  quadril_cm: string;
  braco_cm: string;
  coxa_cm: string;
  restricoes: string[];
  nivel_atividade: NivelAtividade | "";
  usar_descricao_rotina: boolean;
  descricao_rotina: string;
  objetivo_texto: string;
  objetivo_interpretado: { tipo: string; resumo: string; insight: string; superavit: boolean } | null;
  plano_tipo: PlanoTipo | "";
  meta_calorias: number;
  meta_proteina_g: number;
  meta_carboidrato_g: number;
  meta_gordura_g: number;
}

// ── CONSTANTES ────────────────────────────────────────────────────────────────

const NIVEIS_ATIVIDADE: {
  id: NivelAtividade; label: string; fator: number; descricao: string; exemplos: string;
}[] = [
  { id: "sedentario", label: "Sedentário", fator: 1.2,
    descricao: "Fico sentado a maior parte do dia e não pratico exercícios regularmente.",
    exemplos: "Trabalho de escritório, home office sem atividade física." },
  { id: "leve", label: "Levemente Ativo", fator: 1.375,
    descricao: "Pratico exercício leve algumas vezes por semana ou faço caminhadas curtas diárias.",
    exemplos: "1–3 treinos por semana, caminhadas de 20–30 min, trabalho com algum movimento." },
  { id: "moderado", label: "Moderadamente Ativo", fator: 1.55,
    descricao: "Me exercito com regularidade e intensidade moderada durante a semana.",
    exemplos: "3–5 treinos por semana (academia, natação, corrida leve, esportes recreativos)." },
  { id: "ativo", label: "Muito Ativo", fator: 1.725,
    descricao: "Treino intensamente quase todos os dias ou tenho um trabalho que exige muito esforço físico.",
    exemplos: "6–7 treinos por semana, trabalho braçal pesado, atletas amadores." },
  { id: "muito_ativo", label: "Atleta / Extremamente Ativo", fator: 1.9,
    descricao: "Treino muito intensamente todos os dias, às vezes 2 vezes por dia, ou sou atleta de alta performance.",
    exemplos: "Dois treinos diários, atleta profissional, competição ativa." },
];

const RESTRICOES_OPTIONS = [
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "sem_gluten", label: "Sem Glúten" },
  { id: "sem_lactose", label: "Sem Lactose" },
  { id: "sem_frutos_mar", label: "Sem Frutos do Mar" },
  { id: "sem_amendoim", label: "Sem Amendoim" },
];

const PLANOS: { id: PlanoTipo; label: string; deficit: number; cor: string; descricao: string }[] = [
  { id: "conservador", label: "Conservador", deficit: 500,  cor: "emerald", descricao: "Ritmo seguro e sustentável, menor risco de perda muscular." },
  { id: "normal",      label: "Normal",      deficit: 750,  cor: "indigo",  descricao: "Equilíbrio entre velocidade e conforto, recomendado para a maioria." },
  { id: "agressivo",   label: "Agressivo",   deficit: 1000, cor: "orange",  descricao: "Ritmo acelerado, exige mais disciplina e acompanhamento." },
];

const STEPS = [
  { id: 1, label: "Informações Pessoais", icon: User },
  { id: 2, label: "Nível de Atividade",   icon: Activity },
  { id: 3, label: "Objetivos",            icon: Target },
  { id: 4, label: "Plano & Macros",       icon: ChartBar },
];

// ── CÁLCULOS ──────────────────────────────────────────────────────────────────

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  if (hoje.getMonth() - nasc.getMonth() < 0 || (hoje.getMonth() - nasc.getMonth() === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function calcularTMB(sexo: string, peso: number, altura: number, idade: number): number {
  if (sexo === "masculino") return Math.round(10 * peso + 6.25 * altura - 5 * idade + 5);
  return Math.round(10 * peso + 6.25 * altura - 5 * idade - 161);
}

function calcularTDEE(tmb: number, nivel: NivelAtividade): number {
  const fator = NIVEIS_ATIVIDADE.find(n => n.id === nivel)?.fator ?? 1.2;
  return Math.round(tmb * fator);
}

function calcularMacros(calorias: number, peso: number) {
  const proteina_g = Math.round(peso * 2);
  const gordura_g = Math.round((calorias * 0.25) / 9);
  const carbo_g = Math.max(Math.round((calorias - proteina_g * 4 - gordura_g * 9) / 4), 0);
  return { proteina_g, gordura_g, carbo_g };
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function ConfiguracaoSaude() {
  const { user } = useAuth();
  const { salvarPerfil } = useSaudePerfil(user?.id ?? null);
  const router = useRouter();

  // ── estado global ──────────────────────────────────────────────────────────
  const [fase, setFase] = useState<WizardFase>("escolha");
  const [usarClaude, setUsarClaude] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [setupStep, setSetupStep] = useState(1); // passos do guia de configuração (1-4)

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [analisandoRotina, setAnalisandoRotina] = useState(false);
  const [rotinaAnalise, setRotinaAnalise] = useState<{ nivel: NivelAtividade; justificativa: string } | null>(null);

  const [form, setForm] = useState<FormData>({
    data_nascimento: "", sexo: "", altura_cm: "", peso_inicial_kg: "",
    cintura_cm: "", quadril_cm: "", braco_cm: "", coxa_cm: "",
    restricoes: [],
    nivel_atividade: "", usar_descricao_rotina: false, descricao_rotina: "",
    objetivo_texto: "", objetivo_interpretado: null,
    plano_tipo: "", meta_calorias: 0, meta_proteina_g: 0, meta_carboidrato_g: 0, meta_gordura_g: 0,
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErros(prev => { const e = { ...prev }; delete e[key]; return e; });
  }

  function toggleRestricao(id: string) {
    set("restricoes", form.restricoes.includes(id) ? form.restricoes.filter(r => r !== id) : [...form.restricoes, id]);
  }

  const peso = parseFloat(form.peso_inicial_kg) || 0;
  const altura = parseInt(form.altura_cm) || 0;
  const idade = form.data_nascimento ? calcularIdade(form.data_nascimento) : 0;
  const tmb = form.sexo && peso && altura && idade ? calcularTMB(form.sexo, peso, altura, idade) : 0;
  const tdee = tmb && form.nivel_atividade ? calcularTDEE(tmb, form.nivel_atividade as NivelAtividade) : 0;

  // ── análise de rotina ─────────────────────────────────────────────────────

  async function analisarRotina() {
    if (form.descricao_rotina.trim().length < 20) {
      setErros(prev => ({ ...prev, descricao_rotina: "Descreva melhor sua rotina (mínimo 20 caracteres)" }));
      return;
    }
    setAnalisandoRotina(true);
    setRotinaAnalise(null);
    setErros(prev => { const e = { ...prev }; delete e.descricao_rotina; return e; });
    try {
      const res = await fetch("/api/saude/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "atividade", descricao: form.descricao_rotina, apiKey }),
      });
      const data = await res.json();
      if (data.nivel) {
        set("nivel_atividade", data.nivel);
        setRotinaAnalise({ nivel: data.nivel, justificativa: data.justificativa });
      }
    } catch {
      setErros(prev => ({ ...prev, descricao_rotina: "Erro ao analisar. Tente novamente ou selecione o nível manualmente." }));
    }
    setAnalisandoRotina(false);
  }

  // ── teste de API key ───────────────────────────────────────────────────────

  async function testarKey() {
    if (!apiKeyInput.trim()) return;
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await fetch("/api/saude/testar-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("ok");
        setApiKey(apiKeyInput.trim());
      } else {
        setTestStatus("error");
        setTestError(data.error ?? "Erro ao validar a chave.");
      }
    } catch {
      setTestStatus("error");
      setTestError("Erro de conexão. Verifique sua internet.");
    }
  }

  // ── validações ─────────────────────────────────────────────────────────────

  function validarStep1(): boolean {
    const e: Record<string, string> = {};
    if (!form.data_nascimento) e.data_nascimento = "Informe sua data de nascimento";
    if (!form.sexo) e.sexo = "Selecione seu sexo biológico";
    if (!form.altura_cm || parseInt(form.altura_cm) < 100 || parseInt(form.altura_cm) > 250) e.altura_cm = "Altura inválida (100–250 cm)";
    if (!form.peso_inicial_kg || parseFloat(form.peso_inicial_kg) < 30 || parseFloat(form.peso_inicial_kg) > 300) e.peso_inicial_kg = "Peso inválido (30–300 kg)";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function validarStep2(): boolean {
    const e: Record<string, string> = {};
    if (!form.usar_descricao_rotina && !form.nivel_atividade) e.nivel_atividade = "Selecione seu nível de atividade ou descreva sua rotina";
    if (form.usar_descricao_rotina && !rotinaAnalise) e.descricao_rotina = "Clique em Analisar antes de continuar";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function validarStep3(): boolean {
    const e: Record<string, string> = {};
    if (form.objetivo_texto.trim().length < 20) e.objetivo_texto = "Descreva melhor seu objetivo (mínimo 20 caracteres)";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  // ── navegação do wizard ────────────────────────────────────────────────────

  async function avancar() {
    if (step === 1 && !validarStep1()) return;

    if (step === 2) {
      if (!validarStep2()) return;
    }

    if (step === 3) {
      if (!validarStep3()) return;
      setLoading(true);
      if (usarClaude && apiKey) {
        try {
          const res = await fetch("/api/saude/interpretar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo: "objetivo", texto: form.objetivo_texto, tdee, peso, apiKey }),
          });
          const data = await res.json();
          const isGanho = data.superavit;
          const calNormal = Math.max(tdee + (isGanho ? 500 : -750), 1200);
          const macros = calcularMacros(calNormal, peso);
          setForm(prev => ({ ...prev, objetivo_interpretado: data, plano_tipo: "normal", meta_calorias: calNormal, meta_proteina_g: macros.proteina_g, meta_carboidrato_g: macros.carbo_g, meta_gordura_g: macros.gordura_g }));
        } catch {
          const calNormal = Math.max(tdee - 750, 1200);
          const macros = calcularMacros(calNormal, peso);
          setForm(prev => ({ ...prev, plano_tipo: "normal", meta_calorias: calNormal, meta_proteina_g: macros.proteina_g, meta_carboidrato_g: macros.carbo_g, meta_gordura_g: macros.gordura_g }));
        }
      } else {
        const calNormal = Math.max(tdee - 750, 1200);
        const macros = calcularMacros(calNormal, peso);
        setForm(prev => ({ ...prev, plano_tipo: "normal", meta_calorias: calNormal, meta_proteina_g: macros.proteina_g, meta_carboidrato_g: macros.carbo_g, meta_gordura_g: macros.gordura_g }));
      }
      setLoading(false);
    }

    setStep(s => s + 1);
  }

  function selecionarPlano(plano: PlanoTipo) {
    const isGanho = form.objetivo_interpretado?.superavit;
    const deficits: Record<PlanoTipo, number> = { conservador: 500, normal: 750, agressivo: 1000 };
    const delta = isGanho ? deficits[plano] * 0.5 : -deficits[plano];
    const calorias = Math.max(tdee + delta, 1200);
    const macros = calcularMacros(calorias, peso);
    setForm(prev => ({ ...prev, plano_tipo: plano, meta_calorias: Math.round(calorias), meta_proteina_g: macros.proteina_g, meta_carboidrato_g: macros.carbo_g, meta_gordura_g: macros.gordura_g }));
  }

  function ajustarCalorias(novasCal: number) {
    const cal = Math.max(novasCal, 800);
    const macros = calcularMacros(cal, peso);
    setForm(prev => ({ ...prev, meta_calorias: cal, meta_proteina_g: macros.proteina_g, meta_carboidrato_g: macros.carbo_g, meta_gordura_g: macros.gordura_g }));
  }

  function ajustarMacro(macro: "proteina" | "carbo" | "gordura", valor: number) {
    const val = Math.max(valor, 0);
    const novasCal =
      (macro === "proteina" ? val : form.meta_proteina_g) * 4 +
      (macro === "carbo" ? val : form.meta_carboidrato_g) * 4 +
      (macro === "gordura" ? val : form.meta_gordura_g) * 9;
    setForm(prev => ({ ...prev, [`meta_${macro}_g`]: val, meta_calorias: Math.round(novasCal) }));
  }

  async function finalizar() {
    if (!form.plano_tipo) return;
    setLoading(true);
    await salvarPerfil({
      data_nascimento: form.data_nascimento,
      sexo: form.sexo as "masculino" | "feminino",
      altura_cm: parseInt(form.altura_cm),
      peso_inicial_kg: parseFloat(form.peso_inicial_kg),
      cintura_cm: form.cintura_cm ? parseFloat(form.cintura_cm) : null,
      quadril_cm: form.quadril_cm ? parseFloat(form.quadril_cm) : null,
      braco_cm: form.braco_cm ? parseFloat(form.braco_cm) : null,
      coxa_cm: form.coxa_cm ? parseFloat(form.coxa_cm) : null,
      restricoes_alimentares: form.restricoes,
      nivel_atividade: form.nivel_atividade as NivelAtividade,
      rotina_descrita: form.descricao_rotina || null,
      tmb_kcal: tmb,
      tdee_kcal: tdee,
      objetivo_texto: form.objetivo_texto,
      objetivo_tipo: form.objetivo_interpretado?.tipo ?? null,
      objetivo_interpretado: form.objetivo_interpretado as Record<string, unknown> | null,
      plano_tipo: form.plano_tipo as PlanoTipo,
      meta_calorias: form.meta_calorias,
      meta_proteina_g: form.meta_proteina_g,
      meta_carboidrato_g: form.meta_carboidrato_g,
      meta_gordura_g: form.meta_gordura_g,
      anthropic_api_key: usarClaude && apiKey ? apiKey : null,
      configurado: true,
    });
    setLoading(false);
    router.push("/saude");
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Configuração de Saúde</h2>
        <p className="text-gray-400 mt-1">Vamos personalizar o módulo para você — leva menos de 5 minutos</p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FASE: ESCOLHA                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {fase === "escolha" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Antes de começar</h3>
            <p className="text-gray-400 text-sm">
              Nosso módulo de saúde funciona de duas formas. Escolha como prefere configurar:
            </p>
          </div>

          {/* Opção: Com Claude */}
          <button
            onClick={() => { setUsarClaude(true); setFase("setup_api"); }}
            className="w-full text-left p-6 bg-gray-900 border border-gray-800 hover:border-indigo-600 rounded-2xl transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600/20 rounded-xl shrink-0">
                <Sparkles size={22} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold">Usar inteligência do Claude</p>
                  <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full">Recomendado</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">Requer uma conta gratuita na Anthropic e alguns créditos.</p>
                <ul className="space-y-1.5">
                  {[
                    "Análise personalizada do seu objetivo",
                    "Classificação automática do nível de atividade",
                    "Plano de macros adaptado ao seu perfil",
                    "Insights e sugestões de melhoria (em breve)",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check size={13} className="text-indigo-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <ArrowRight size={18} className="text-gray-600 group-hover:text-indigo-400 transition-colors mt-1 shrink-0" />
            </div>
          </button>

          {/* Opção: Sem Claude */}
          <button
            onClick={() => { setUsarClaude(false); setFase("wizard"); }}
            className="w-full text-left p-6 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-800 rounded-xl shrink-0">
                <Zap size={22} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Continuar sem IA</p>
                <p className="text-gray-400 text-sm mb-3">Tudo funciona perfeitamente. Apenas sem as análises automáticas.</p>
                <ul className="space-y-1.5">
                  {[
                    "Cálculo de TMB e TDEE com fórmula Mifflin-St Jeor",
                    "3 planos de calorias e macros para escolher",
                    "Editor interativo de macros",
                    "Análise do objetivo feita por você",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check size={13} className="text-gray-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-600 mt-3">Você poderá ativar o Claude depois em Configurações.</p>
              </div>
              <ArrowRight size={18} className="text-gray-600 group-hover:text-white transition-colors mt-1 shrink-0" />
            </div>
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FASE: SETUP DA API                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {fase === "setup_api" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600/20 rounded-xl">
              <Key size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Configurar API do Claude</h3>
              <p className="text-gray-500 text-sm">Siga os passos abaixo — leva menos de 2 minutos</p>
            </div>
          </div>

          {/* Progresso dos passos */}
          <div className="flex items-center gap-0 mb-8">
            {[1, 2, 3, 4].map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  setupStep > s ? "bg-emerald-600 text-white" : setupStep === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-600"
                }`}>
                  {setupStep > s ? <Check size={13} /> : s}
                </div>
                {i < 3 && <div className={`h-px flex-1 mx-1 transition-colors ${setupStep > s ? "bg-emerald-600" : "bg-gray-800"}`} />}
              </div>
            ))}
          </div>

          {/* Passo 1: Criar conta */}
          {setupStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Passo 1 — Criar conta na Anthropic</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                O Claude é desenvolvido pela Anthropic. Você precisa de uma conta para usar a API. O cadastro é gratuito e não exige cartão de crédito para começar.
              </p>
              <div className="p-4 bg-gray-800 rounded-xl space-y-3 text-sm text-gray-300">
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>Clique no botão abaixo para abrir o site da Anthropic</p>
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>Clique em <strong className="text-white">Sign Up</strong> e crie sua conta com e-mail ou Google</p>
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>Confirme seu e-mail se necessário</p>
              </div>
              <a
                href="https://console.anthropic.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Abrir console.anthropic.com
                <ExternalLink size={14} />
              </a>
              <p className="text-xs text-gray-600 text-center">Já tem conta? Pode pular para o próximo passo.</p>
            </div>
          )}

          {/* Passo 2: Adicionar créditos */}
          {setupStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Passo 2 — Adicionar créditos</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                A API é paga por uso, mas o custo é muito baixo. Para as funcionalidades deste app, <strong className="text-white">USD $5 duram vários meses</strong> de uso normal.
              </p>
              <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-xl">
                <p className="text-xs text-emerald-400 font-semibold mb-1">💡 Estimativa de custo</p>
                <p className="text-xs text-emerald-300">Cada configuração completa do wizard usa ~0,001 USD. Com $5 você faz mais de 5.000 análises.</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-xl space-y-3 text-sm text-gray-300">
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>No console, vá em <strong className="text-white">Settings → Billing</strong></p>
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>Clique em <strong className="text-white">Add credits</strong> e adicione o valor mínimo (USD $5)</p>
              </div>
              <a
                href="https://console.anthropic.com/settings/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Ir para Billing
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Passo 3: Criar API Key */}
          {setupStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Passo 3 — Criar sua API Key</h4>
              <p className="text-gray-400 text-sm">A API Key é a senha que permite que este app se comunique com o Claude.</p>
              <div className="p-4 bg-gray-800 rounded-xl space-y-3 text-sm text-gray-300">
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>Clique no botão abaixo para ir até a página de API Keys</p>
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>Clique em <strong className="text-white">Create Key</strong></p>
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>Dê um nome como <strong className="text-white">meu-hub</strong> e clique em <strong className="text-white">Create Key</strong></p>
                <p className="flex items-start gap-2"><span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>Copie a chave que aparece — ela começa com <code className="text-indigo-300">sk-ant-</code></p>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-xl">
                <p className="text-xs text-amber-400">⚠️ A chave só é mostrada uma vez. Copie antes de fechar a janela.</p>
              </div>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Ir para API Keys
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Passo 4: Colar e testar */}
          {setupStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Passo 4 — Cole sua chave e teste</h4>
              <p className="text-gray-400 text-sm">Cole a chave que você acabou de criar abaixo e clique em Testar para confirmar que está funcionando.</p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Sua API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="sk-ant-api03-..."
                    value={apiKeyInput}
                    onChange={e => { setApiKeyInput(e.target.value); setTestStatus("idle"); }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => { navigator.clipboard.readText().then(t => { setApiKeyInput(t); setTestStatus("idle"); }).catch(() => {}); }}
                    className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                    title="Colar da área de transferência"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              <button
                onClick={testarKey}
                disabled={!apiKeyInput.trim() || testStatus === "testing"}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testStatus === "testing" && <Loader2 size={15} className="animate-spin" />}
                {testStatus === "ok" && <CheckCircle size={15} className="text-emerald-300" />}
                {testStatus === "error" && <XCircle size={15} className="text-red-400" />}
                {testStatus === "testing" ? "Testando conexão..." : testStatus === "ok" ? "Chave válida! ✓" : "Testar conexão"}
              </button>

              {testStatus === "ok" && (
                <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300">Conexão estabelecida com sucesso! Sua chave está funcionando.</p>
                </div>
              )}

              {testStatus === "error" && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-2">
                  <XCircle size={15} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{testError}</p>
                </div>
              )}

              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                <p className="text-xs text-gray-500">🔒 Sua chave é armazenada de forma segura e usada apenas para processar suas solicitações neste app.</p>
              </div>
            </div>
          )}

          {/* Botões de navegação do setup */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={() => setupStep === 1 ? setFase("escolha") : setSetupStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>

            {setupStep < 4 ? (
              <button
                onClick={() => setSetupStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => { if (testStatus === "ok") setFase("wizard"); }}
                disabled={testStatus !== "ok"}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={16} />
                Começar configuração
              </button>
            )}
          </div>

          {/* Pular setup */}
          {setupStep < 4 && (
            <button
              onClick={() => { setUsarClaude(false); setFase("wizard"); }}
              className="w-full mt-3 text-center text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
            >
              Pular e continuar sem Claude →
            </button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FASE: WIZARD (4 etapas)                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {fase === "wizard" && (
        <>
          {/* Badge de modo */}
          <div className={`flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg w-fit text-xs font-medium ${
            usarClaude ? "bg-indigo-600/20 text-indigo-400" : "bg-gray-800 text-gray-500"
          }`}>
            {usarClaude ? <Sparkles size={12} /> : <ZapOff size={12} />}
            {usarClaude ? "Modo Claude ativado" : "Modo padrão (sem IA)"}
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mb-10">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const ativo = step === s.id;
              const concluido = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      concluido ? "bg-emerald-600" : ativo ? "bg-indigo-600" : "bg-gray-800 border border-gray-700"
                    }`}>
                      {concluido ? <Check size={18} className="text-white" /> : <Icon size={18} className={ativo ? "text-white" : "text-gray-500"} />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block text-center leading-tight ${
                      ativo ? "text-white" : concluido ? "text-emerald-400" : "text-gray-600"
                    }`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-1 mt-[-12px] sm:mt-[-24px] transition-colors ${concluido ? "bg-emerald-600" : "bg-gray-800"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card do step */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">

            {/* ── STEP 1: Informações Pessoais ── */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Data de Nascimento</label>
                    <input type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} max={new Date().toISOString().split("T")[0]}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    {erros.data_nascimento && <p className="text-red-400 text-xs mt-1">{erros.data_nascimento}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Sexo Biológico</label>
                    <div className="flex gap-2">
                      {(["masculino", "feminino"] as const).map(s => (
                        <button key={s} onClick={() => set("sexo", s)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.sexo === s ? "bg-indigo-600 border-indigo-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                          {s === "masculino" ? "Masculino" : "Feminino"}
                        </button>
                      ))}
                    </div>
                    {erros.sexo && <p className="text-red-400 text-xs mt-1">{erros.sexo}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Altura (cm)</label>
                    <input type="number" placeholder="175" value={form.altura_cm} onChange={e => set("altura_cm", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    {erros.altura_cm && <p className="text-red-400 text-xs mt-1">{erros.altura_cm}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Peso Atual (kg)</label>
                    <input type="number" step="0.1" placeholder="80.5" value={form.peso_inicial_kg} onChange={e => set("peso_inicial_kg", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    {erros.peso_inicial_kg && <p className="text-red-400 text-xs mt-1">{erros.peso_inicial_kg}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-medium text-gray-300">Medidas Corporais</p>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">opcional</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Registrar agora permite acompanhar sua evolução ao longo do tempo</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "cintura_cm", label: "Cintura (cm)", placeholder: "85" },
                      { key: "quadril_cm", label: "Quadril (cm)", placeholder: "100" },
                      { key: "braco_cm",   label: "Braço (cm)",   placeholder: "35" },
                      { key: "coxa_cm",    label: "Coxa (cm)",    placeholder: "58" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <input type="number" step="0.1" placeholder={placeholder} value={form[key as keyof FormData] as string}
                          onChange={e => set(key as keyof FormData, e.target.value as never)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-medium text-gray-300">Restrições Alimentares</p>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">opcional</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {RESTRICOES_OPTIONS.map(r => (
                      <button key={r.id} onClick={() => toggleRestricao(r.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.restricoes.includes(r.id) ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Nível de Atividade ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Nível de Atividade Física</h3>
                  <p className="text-gray-400 text-sm mt-1">Essencial para calcular seu gasto calórico total (TDEE). Seja honesto — subestimar leva a metas mais precisas.</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => set("usar_descricao_rotina", false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${!form.usar_descricao_rotina ? "bg-indigo-600 border-indigo-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                    Selecionar nível
                  </button>
                  <button onClick={() => usarClaude && set("usar_descricao_rotina", true)} disabled={!usarClaude}
                    title={!usarClaude ? "Disponível apenas no modo Claude" : undefined}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.usar_descricao_rotina ? "bg-indigo-600 border-indigo-600 text-white" : usarClaude ? "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600" : "bg-gray-800/40 border-gray-800 text-gray-600 cursor-not-allowed"}`}>
                    <span className="flex items-center justify-center gap-1.5">
                      {!usarClaude && <ZapOff size={13} />}
                      Descrever minha rotina
                    </span>
                  </button>
                </div>

                {!usarClaude && (
                  <div className="flex items-center gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <ZapOff size={13} className="text-gray-500 shrink-0" />
                    <p className="text-xs text-gray-500">Classificação por descrição requer o modo Claude. Selecione o nível manualmente abaixo.</p>
                  </div>
                )}

                {!form.usar_descricao_rotina ? (
                  <div className="space-y-2">
                    {NIVEIS_ATIVIDADE.map(nivel => (
                      <button key={nivel.id} onClick={() => set("nivel_atividade", nivel.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${form.nivel_atividade === nivel.id ? "bg-indigo-600/10 border-indigo-500" : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-0.5 ${form.nivel_atividade === nivel.id ? "text-indigo-300" : "text-white"}`}>
                              {nivel.label}
                              <span className="ml-2 text-xs font-normal text-gray-500">×{nivel.fator}</span>
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">{nivel.descricao}</p>
                            <p className="text-xs text-gray-600 mt-1 italic">{nivel.exemplos}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors ${form.nivel_atividade === nivel.id ? "border-indigo-500 bg-indigo-500" : "border-gray-600"}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-2 mb-3 p-3 bg-indigo-950/40 border border-indigo-900 rounded-xl">
                      <Sparkles size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-indigo-300">O Claude vai analisar sua rotina e classificar no nível mais adequado, sendo conservador quando houver dúvida.</p>
                    </div>

                    <textarea
                      value={form.descricao_rotina}
                      onChange={e => {
                        set("descricao_rotina", e.target.value);
                        // resetar análise se o texto mudar após uma análise
                        if (rotinaAnalise) { setRotinaAnalise(null); set("nivel_atividade", ""); }
                      }}
                      rows={4}
                      placeholder="Ex: Trabalho no escritório 8h por dia, vou à academia 3x por semana fazendo musculação de 1h, nos finais de semana costumo caminhar ou pedalar..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none placeholder-gray-600"
                    />

                    {/* Botão Analisar */}
                    {!rotinaAnalise && (
                      <button
                        onClick={analisarRotina}
                        disabled={analisandoRotina || form.descricao_rotina.trim().length < 20}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {analisandoRotina ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        {analisandoRotina ? "Analisando sua rotina..." : "Analisar minha rotina"}
                      </button>
                    )}

                    {erros.descricao_rotina && <p className="text-red-400 text-xs mt-2">{erros.descricao_rotina}</p>}

                    {/* Resultado da análise */}
                    {rotinaAnalise && (
                      <div className="mt-3 p-4 bg-emerald-900/20 border border-emerald-800 rounded-xl space-y-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-400 mb-0.5">Análise concluída</p>
                            <p className="text-xs text-emerald-300 leading-relaxed">{rotinaAnalise.justificativa}</p>
                          </div>
                        </div>

                        {/* Nível selecionado com opção de alterar */}
                        <div className="pt-2 border-t border-emerald-800/50">
                          <p className="text-xs text-gray-400 mb-2">Nível identificado — altere se preferir:</p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {NIVEIS_ATIVIDADE.map(nivel => (
                              <button
                                key={nivel.id}
                                onClick={() => { set("nivel_atividade", nivel.id); setRotinaAnalise(prev => prev ? { ...prev, nivel: nivel.id } : prev); }}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                                  form.nivel_atividade === nivel.id
                                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold"
                                    : "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600"
                                }`}
                              >
                                <span className="flex items-center justify-between">
                                  <span>{nivel.label}</span>
                                  {form.nivel_atividade === nivel.id && <Check size={12} className="text-emerald-400" />}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => { setRotinaAnalise(null); set("nivel_atividade", ""); }}
                          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                        >
                          Reanalisar com texto diferente
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {erros.nivel_atividade && <p className="text-red-400 text-xs">{erros.nivel_atividade}</p>}

                {tmb > 0 && form.nivel_atividade && (
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-0.5">TMB (Basal)</p>
                      <p className="text-xl font-bold text-white">{tmb.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">kcal/dia</p>
                    </div>
                    <div className="flex-1 bg-indigo-950/50 border border-indigo-900 rounded-xl p-3 text-center">
                      <p className="text-xs text-indigo-400 mb-0.5">TDEE (Total)</p>
                      <p className="text-xl font-bold text-indigo-300">{tdee.toLocaleString()}</p>
                      <p className="text-xs text-indigo-600">kcal/dia</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Objetivos ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Seus Objetivos</h3>
                  <p className="text-gray-400 text-sm mt-1">Escreva livremente — o que você quer alcançar, em quanto tempo, e qualquer contexto relevante.</p>
                </div>

                {usarClaude ? (
                  <div className="flex items-start gap-2 p-3 bg-indigo-950/40 border border-indigo-900 rounded-xl">
                    <Sparkles size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-300">O Claude vai interpretar seu objetivo e criar 3 planos personalizados de calorias e macros para você escolher.</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <ZapOff size={14} className="text-gray-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500">Sem o Claude, os planos são calculados automaticamente com base no seu TDEE. Você poderá editar os macros livremente.</p>
                  </div>
                )}

                <div>
                  <textarea value={form.objetivo_texto} onChange={e => set("objetivo_texto", e.target.value)} rows={6}
                    placeholder="Ex: Quero perder gordura abdominal e ficar mais definido. Tenho um casamento em 4 meses e quero chegar bem. Não me importo de ser um pouco mais rigoroso mas quero manter a massa muscular que já tenho..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none placeholder-gray-600" />
                  <div className="flex items-center justify-between mt-1">
                    {erros.objetivo_texto ? <p className="text-red-400 text-xs">{erros.objetivo_texto}</p> : <span />}
                    <p className={`text-xs ${form.objetivo_texto.length < 20 ? "text-gray-600" : "text-gray-500"}`}>{form.objetivo_texto.length} caracteres</p>
                  </div>
                </div>

                {tdee > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
                    <Info size={14} className="text-gray-500 shrink-0" />
                    <p className="text-xs text-gray-400">Seu gasto calórico total é <strong className="text-white">{tdee.toLocaleString()} kcal/dia</strong>. Os planos serão calculados com base nesse valor.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Plano & Macros ── */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Escolha seu Plano</h3>

                {usarClaude && form.objetivo_interpretado ? (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-900 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Análise do Claude</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{form.objetivo_interpretado.resumo}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{form.objetivo_interpretado.insight}</p>
                  </div>
                ) : !usarClaude ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <ZapOff size={13} className="text-gray-500 shrink-0" />
                    <p className="text-xs text-gray-500">Planos calculados com base no seu TDEE de <strong className="text-gray-400">{tdee.toLocaleString()} kcal</strong>. Ajuste os macros como preferir.</p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  {PLANOS.map(plano => {
                    const isGanho = form.objetivo_interpretado?.superavit;
                    const delta = isGanho ? plano.deficit * 0.5 : -plano.deficit;
                    const cal = Math.max(tdee + delta, 1200);
                    const ritmo = (plano.deficit / 7000 * 7).toFixed(2);
                    const selecionado = form.plano_tipo === plano.id;
                    return (
                      <button key={plano.id} onClick={() => selecionarPlano(plano.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${selecionado ? `bg-${plano.cor}-600/10 border-${plano.cor}-500` : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${selecionado ? `text-${plano.cor}-300` : "text-white"}`}>{plano.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{plano.descricao}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${selecionado ? `text-${plano.cor}-300` : "text-white"}`}>{Math.round(cal).toLocaleString()} kcal</p>
                            <p className="text-xs text-gray-500">~{ritmo} kg/semana</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {form.plano_tipo && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm font-semibold text-white">Ajuste os Macros</p>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">interativo</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Edite calorias ou macros — os valores se ajustam automaticamente.</p>

                    <div className="mb-4 p-4 bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">Calorias Totais</span>
                        <span className="text-xs text-gray-500">TDEE: {tdee.toLocaleString()} kcal</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => ajustarCalorias(form.meta_calorias - 50)} className="w-8 h-8 rounded-lg bg-gray-700 text-white text-lg font-bold hover:bg-gray-600 flex items-center justify-center">−</button>
                        <input type="number" value={form.meta_calorias} onChange={e => ajustarCalorias(parseInt(e.target.value) || 0)}
                          className="flex-1 bg-transparent text-2xl font-bold text-indigo-300 text-center focus:outline-none" />
                        <button onClick={() => ajustarCalorias(form.meta_calorias + 50)} className="w-8 h-8 rounded-lg bg-gray-700 text-white text-lg font-bold hover:bg-gray-600 flex items-center justify-center">+</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "proteina" as const, label: "Proteína",    value: form.meta_proteina_g,    cor: "blue",  cal: 4 },
                        { key: "carbo" as const,    label: "Carboidrato", value: form.meta_carboidrato_g, cor: "amber", cal: 4 },
                        { key: "gordura" as const,  label: "Gordura",     value: form.meta_gordura_g,     cor: "rose",  cal: 9 },
                      ].map(macro => (
                        <div key={macro.key} className="bg-gray-800 rounded-xl p-3 text-center">
                          <p className={`text-xs font-medium text-${macro.cor}-400 mb-2`}>{macro.label}</p>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => ajustarMacro(macro.key, macro.value - 5)} className="w-5 h-5 rounded bg-gray-700 text-white text-xs hover:bg-gray-600 flex items-center justify-center">−</button>
                            <input type="number" value={macro.value} onChange={e => ajustarMacro(macro.key, parseInt(e.target.value) || 0)}
                              className="w-14 bg-transparent text-lg font-bold text-white text-center focus:outline-none" />
                            <button onClick={() => ajustarMacro(macro.key, macro.value + 5)} className="w-5 h-5 rounded bg-gray-700 text-white text-xs hover:bg-gray-600 flex items-center justify-center">+</button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{macro.value * macro.cal} kcal</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex rounded-full overflow-hidden h-2">
                      {(() => {
                        const total = form.meta_proteina_g * 4 + form.meta_carboidrato_g * 4 + form.meta_gordura_g * 9;
                        if (!total) return null;
                        return [
                          { pct: (form.meta_proteina_g * 4 / total) * 100, cor: "bg-blue-500" },
                          { pct: (form.meta_carboidrato_g * 4 / total) * 100, cor: "bg-amber-500" },
                          { pct: (form.meta_gordura_g * 9 / total) * 100, cor: "bg-rose-500" },
                        ].map((b, i) => <div key={i} style={{ width: `${b.pct}%` }} className={`${b.cor} transition-all`} />);
                      })()}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Proteína {Math.round(form.meta_proteina_g * 4 / Math.max(form.meta_calorias, 1) * 100)}%</span>
                      <span>Carbo {Math.round(form.meta_carboidrato_g * 4 / Math.max(form.meta_calorias, 1) * 100)}%</span>
                      <span>Gordura {Math.round(form.meta_gordura_g * 9 / Math.max(form.meta_calorias, 1) * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botões de navegação */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
              <button onClick={() => step === 1 ? setFase("escolha") : setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <ChevronLeft size={16} />
                Voltar
              </button>

              {step < 4 ? (
                <button onClick={avancar} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Analisando..." : "Próximo"}
                  {!loading && <ChevronRight size={16} />}
                </button>
              ) : (
                <button onClick={finalizar} disabled={loading || !form.plano_tipo}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {loading ? "Salvando..." : "Concluir Configuração"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
