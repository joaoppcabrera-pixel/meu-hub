"use client";

import { useState, useEffect } from "react";
import { useSaudePerfil } from "@/lib/hooks/useSaudePerfil";
import {
  Save, Loader2, CheckCircle, XCircle, Sparkles, Key,
  ExternalLink, Copy, Eye, EyeOff, AlertCircle, Trash2,
} from "lucide-react";

// ── TIPOS ─────────────────────────────────────────────────────────────────────

type NivelAtividade = "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
type PlanoTipo = "conservador" | "normal" | "agressivo";

// ── CONSTANTES ────────────────────────────────────────────────────────────────

const NIVEIS_ATIVIDADE: {
  id: NivelAtividade; label: string; fator: number; descricao: string;
}[] = [
  { id: "sedentario",  label: "Sedentário",               fator: 1.2,   descricao: "Fico sentado a maior parte do dia, sem exercícios regulares." },
  { id: "leve",        label: "Levemente Ativo",           fator: 1.375, descricao: "Exercício leve 1–3x por semana ou caminhadas curtas." },
  { id: "moderado",    label: "Moderadamente Ativo",       fator: 1.55,  descricao: "Exercício regular 3–5x por semana." },
  { id: "ativo",       label: "Muito Ativo",               fator: 1.725, descricao: "Treinos intensos 6–7x por semana ou trabalho físico pesado." },
  { id: "muito_ativo", label: "Atleta / Extremamente Ativo", fator: 1.9, descricao: "Dois treinos diários ou atleta de alta performance." },
];

const RESTRICOES_OPTIONS = [
  { id: "vegetariano",    label: "Vegetariano" },
  { id: "vegano",         label: "Vegano" },
  { id: "sem_gluten",     label: "Sem Glúten" },
  { id: "sem_lactose",    label: "Sem Lactose" },
  { id: "sem_frutos_mar", label: "Sem Frutos do Mar" },
  { id: "sem_amendoim",   label: "Sem Amendoim" },
];

const PLANOS: { id: PlanoTipo; label: string; deficit: number; cor: string; descricao: string }[] = [
  { id: "conservador", label: "Conservador", deficit: 500,  cor: "emerald", descricao: "Ritmo seguro e sustentável." },
  { id: "normal",      label: "Normal",      deficit: 750,  cor: "indigo",  descricao: "Equilíbrio entre velocidade e conforto." },
  { id: "agressivo",   label: "Agressivo",   deficit: 1000, cor: "orange",  descricao: "Ritmo acelerado, exige mais disciplina." },
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

// ── SEÇÃO ─────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
}

type Secao = "pessoal" | "atividade" | "objetivo" | "macros" | "claude";

export default function SaudeSection({ userId }: Props) {
  const { perfil, loading, salvarPerfil } = useSaudePerfil(userId);

  const [secao, setSecao] = useState<Secao>("pessoal");
  const [salvando, setSalvando] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});

  // ── Campos ────────────────────────────────────────────────────────────────

  const [data_nascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"masculino" | "feminino" | "">("");
  const [altura_cm, setAltura] = useState("");
  const [peso_inicial_kg, setPeso] = useState("");
  const [cintura_cm, setCintura] = useState("");
  const [quadril_cm, setQuadril] = useState("");
  const [braco_cm, setBraco] = useState("");
  const [coxa_cm, setCoxa] = useState("");
  const [restricoes, setRestricoes] = useState<string[]>([]);

  const [nivel_atividade, setNivel] = useState<NivelAtividade | "">("");
  const [rotina_descrita, setRotina] = useState("");
  const [analisandoRotina, setAnalisandoRotina] = useState(false);
  const [rotinaAnalise, setRotinaAnalise] = useState<{ nivel: NivelAtividade; justificativa: string } | null>(null);

  const [objetivo_texto, setObjetivo] = useState("");

  const [plano_tipo, setPlano] = useState<PlanoTipo | "">("");
  const [meta_calorias, setMetaCal] = useState(0);
  const [meta_proteina_g, setMetaProt] = useState(0);
  const [meta_carboidrato_g, setMetaCarbo] = useState(0);
  const [meta_gordura_g, setMetaGord] = useState(0);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [temApiKey, setTemApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState("");

  // ── Carregar perfil ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!perfil) return;
    setDataNascimento(perfil.data_nascimento ?? "");
    setSexo(perfil.sexo ?? "");
    setAltura(String(perfil.altura_cm ?? ""));
    setPeso(String(perfil.peso_inicial_kg ?? ""));
    setCintura(perfil.cintura_cm ? String(perfil.cintura_cm) : "");
    setQuadril(perfil.quadril_cm ? String(perfil.quadril_cm) : "");
    setBraco(perfil.braco_cm ? String(perfil.braco_cm) : "");
    setCoxa(perfil.coxa_cm ? String(perfil.coxa_cm) : "");
    setRestricoes(perfil.restricoes_alimentares ?? []);
    setNivel(perfil.nivel_atividade ?? "");
    setRotina(perfil.rotina_descrita ?? "");
    setObjetivo(perfil.objetivo_texto ?? "");
    setPlano((perfil.plano_tipo as PlanoTipo) ?? "");
    setMetaCal(perfil.meta_calorias ?? 0);
    setMetaProt(perfil.meta_proteina_g ?? 0);
    setMetaCarbo(perfil.meta_carboidrato_g ?? 0);
    setMetaGord(perfil.meta_gordura_g ?? 0);
    setTemApiKey(!!perfil.anthropic_api_key);
  }, [perfil]);

  // ── Derivados ─────────────────────────────────────────────────────────────

  const peso = parseFloat(peso_inicial_kg) || 0;
  const altura = parseInt(altura_cm) || 0;
  const idade = data_nascimento ? calcularIdade(data_nascimento) : 0;
  const tmb = sexo && peso && altura && idade ? calcularTMB(sexo, peso, altura, idade) : 0;
  const tdee = tmb && nivel_atividade ? calcularTDEE(tmb, nivel_atividade as NivelAtividade) : 0;

  // ── Helpers de macro ─────────────────────────────────────────────────────

  function ajustarCalorias(cal: number) {
    const c = Math.max(cal, 800);
    const m = calcularMacros(c, peso);
    setMetaCal(c); setMetaProt(m.proteina_g); setMetaCarbo(m.carbo_g); setMetaGord(m.gordura_g);
  }

  function ajustarMacro(macro: "proteina" | "carbo" | "gordura", valor: number) {
    const v = Math.max(valor, 0);
    const prot = macro === "proteina" ? v : meta_proteina_g;
    const carb = macro === "carbo" ? v : meta_carboidrato_g;
    const gord = macro === "gordura" ? v : meta_gordura_g;
    const cal = prot * 4 + carb * 4 + gord * 9;
    if (macro === "proteina") setMetaProt(v);
    if (macro === "carbo") setMetaCarbo(v);
    if (macro === "gordura") setMetaGord(v);
    setMetaCal(Math.round(cal));
  }

  function selecionarPlano(plano: PlanoTipo) {
    const deficits: Record<PlanoTipo, number> = { conservador: 500, normal: 750, agressivo: 1000 };
    const calorias = Math.max(tdee - deficits[plano], 1200);
    const macros = calcularMacros(calorias, peso);
    setPlano(plano);
    setMetaCal(Math.round(calorias));
    setMetaProt(macros.proteina_g);
    setMetaCarbo(macros.carbo_g);
    setMetaGord(macros.gordura_g);
  }

  // ── Análise de rotina ─────────────────────────────────────────────────────

  async function analisarRotina() {
    if (rotina_descrita.trim().length < 20) {
      setErros(prev => ({ ...prev, rotina: "Descreva melhor sua rotina (mínimo 20 caracteres)" }));
      return;
    }
    setAnalisandoRotina(true);
    setRotinaAnalise(null);
    setErros(prev => { const e = { ...prev }; delete e.rotina; return e; });
    try {
      const res = await fetch("/api/saude/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "atividade", descricao: rotina_descrita }),
      });
      const data = await res.json();
      if (data.nivel) {
        setNivel(data.nivel);
        setRotinaAnalise({ nivel: data.nivel, justificativa: data.justificativa });
      }
    } catch {
      setErros(prev => ({ ...prev, rotina: "Erro ao analisar. Selecione o nível manualmente." }));
    }
    setAnalisandoRotina(false);
  }

  // ── API Key ───────────────────────────────────────────────────────────────

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
      if (data.ok) { setTestStatus("ok"); }
      else { setTestStatus("error"); setTestError(data.error ?? "Erro ao validar a chave."); }
    } catch {
      setTestStatus("error");
      setTestError("Erro de conexão. Verifique sua internet.");
    }
  }

  async function salvarApiKey() {
    if (testStatus !== "ok") return;
    setSalvando(true);
    await salvarPerfil({ anthropic_api_key: apiKeyInput.trim() });
    setTemApiKey(true);
    setApiKeyInput("");
    setTestStatus("idle");
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setSalvando(false);
  }

  async function removerApiKey() {
    setSalvando(true);
    await salvarPerfil({ anthropic_api_key: null });
    setTemApiKey(false);
    setApiKeyInput("");
    setTestStatus("idle");
    setSalvando(false);
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  async function salvar() {
    const e: Record<string, string> = {};
    if (!data_nascimento) e.data_nascimento = "Obrigatório";
    if (!sexo) e.sexo = "Obrigatório";
    if (!altura_cm || parseInt(altura_cm) < 100) e.altura_cm = "Altura inválida";
    if (!peso_inicial_kg || parseFloat(peso_inicial_kg) < 30) e.peso_inicial_kg = "Peso inválido";
    if (!nivel_atividade) e.nivel_atividade = "Selecione o nível";
    if (objetivo_texto.trim().length < 20) e.objetivo_texto = "Mínimo 20 caracteres";
    if (!plano_tipo) e.plano_tipo = "Selecione um plano";

    if (Object.keys(e).length > 0) {
      setErros(e);
      // Ir para a primeira seção com erro
      if (e.data_nascimento || e.sexo || e.altura_cm || e.peso_inicial_kg) setSecao("pessoal");
      else if (e.nivel_atividade) setSecao("atividade");
      else if (e.objetivo_texto) setSecao("objetivo");
      else if (e.plano_tipo) setSecao("macros");
      return;
    }
    setErros({});
    setSalvando(true);
    await salvarPerfil({
      data_nascimento,
      sexo: sexo as "masculino" | "feminino",
      altura_cm: parseInt(altura_cm),
      peso_inicial_kg: parseFloat(peso_inicial_kg),
      cintura_cm: cintura_cm ? parseFloat(cintura_cm) : null,
      quadril_cm: quadril_cm ? parseFloat(quadril_cm) : null,
      braco_cm: braco_cm ? parseFloat(braco_cm) : null,
      coxa_cm: coxa_cm ? parseFloat(coxa_cm) : null,
      restricoes_alimentares: restricoes,
      nivel_atividade: nivel_atividade as NivelAtividade,
      rotina_descrita: rotina_descrita || null,
      tmb_kcal: tmb,
      tdee_kcal: tdee,
      objetivo_texto,
      plano_tipo: plano_tipo as PlanoTipo,
      meta_calorias,
      meta_proteina_g,
      meta_carboidrato_g,
      meta_gordura_g,
      configurado: true,
    });
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setSalvando(false);
  }

  // ── Sub-seções ─────────────────────────────────────────────────────────────

  const SECOES: { id: Secao; label: string; temErro?: boolean }[] = [
    { id: "pessoal",   label: "Dados Pessoais",    temErro: !!(erros.data_nascimento || erros.sexo || erros.altura_cm || erros.peso_inicial_kg) },
    { id: "atividade", label: "Nível de Atividade", temErro: !!erros.nivel_atividade },
    { id: "objetivo",  label: "Objetivos",          temErro: !!erros.objetivo_texto },
    { id: "macros",    label: "Plano & Macros",      temErro: !!erros.plano_tipo },
    { id: "claude",    label: "Integração Claude" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 gap-3 text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Carregando perfil de saúde...</span>
      </div>
    );
  }

  if (!perfil?.configurado) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
        <p className="text-gray-400 text-sm">O módulo de saúde ainda não foi configurado.</p>
        <a href="/saude/configuracao" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
          Configurar agora →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Módulo de Saúde</h3>
          <p className="text-gray-500 text-sm mt-0.5">Edite seu perfil, metas e integrações</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle size={12} />
              Salvo às {savedAt}
            </span>
          )}
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Tabs internas */}
      <div className="flex gap-1 flex-wrap bg-gray-900 border border-gray-800 rounded-2xl p-1 w-fit">
        {SECOES.map(s => (
          <button
            key={s.id}
            onClick={() => setSecao(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              secao === s.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {s.temErro && <AlertCircle size={12} className="text-red-400" />}
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

        {/* ── DADOS PESSOAIS ─────────────────────────────────────────────── */}
        {secao === "pessoal" && (
          <div className="space-y-6">
            <h4 className="text-white font-semibold">Dados Pessoais</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Data de Nascimento</label>
                <input type="date" value={data_nascimento} onChange={e => setDataNascimento(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                {erros.data_nascimento && <p className="text-red-400 text-xs mt-1">{erros.data_nascimento}</p>}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Sexo Biológico</label>
                <div className="flex gap-2">
                  {(["masculino", "feminino"] as const).map(s => (
                    <button key={s} onClick={() => setSexo(s)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${sexo === s ? "bg-indigo-600 border-indigo-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                      {s === "masculino" ? "Masculino" : "Feminino"}
                    </button>
                  ))}
                </div>
                {erros.sexo && <p className="text-red-400 text-xs mt-1">{erros.sexo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Altura (cm)</label>
                <input type="number" placeholder="175" value={altura_cm} onChange={e => setAltura(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                {erros.altura_cm && <p className="text-red-400 text-xs mt-1">{erros.altura_cm}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Peso (kg)</label>
                <input type="number" step="0.1" placeholder="80.5" value={peso_inicial_kg} onChange={e => setPeso(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                {erros.peso_inicial_kg && <p className="text-red-400 text-xs mt-1">{erros.peso_inicial_kg}</p>}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Medidas Corporais <span className="text-xs text-gray-500 ml-1">(opcional)</span></p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "cintura", label: "Cintura (cm)", value: cintura_cm, set: setCintura },
                  { key: "quadril", label: "Quadril (cm)", value: quadril_cm, set: setQuadril },
                  { key: "braco",   label: "Braço (cm)",   value: braco_cm,   set: setBraco },
                  { key: "coxa",    label: "Coxa (cm)",    value: coxa_cm,    set: setCoxa },
                ].map(({ key, label, value, set: setter }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input type="number" step="0.1" value={value} onChange={e => setter(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Restrições Alimentares <span className="text-xs text-gray-500 ml-1">(opcional)</span></p>
              <div className="flex flex-wrap gap-2">
                {RESTRICOES_OPTIONS.map(r => (
                  <button key={r.id}
                    onClick={() => setRestricoes(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${restricoes.includes(r.id) ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {tmb > 0 && (
              <div className="flex gap-3 p-4 bg-gray-800 rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">TMB calculada</p>
                  <p className="text-xl font-bold text-white">{tmb.toLocaleString()} kcal</p>
                </div>
                {nivel_atividade && (
                  <div className="flex-1 text-center border-l border-gray-700">
                    <p className="text-xs text-indigo-400 mb-0.5">TDEE total</p>
                    <p className="text-xl font-bold text-indigo-300">{tdee.toLocaleString()} kcal</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── NÍVEL DE ATIVIDADE ─────────────────────────────────────────── */}
        {secao === "atividade" && (
          <div className="space-y-5">
            <h4 className="text-white font-semibold">Nível de Atividade Física</h4>

            <div className="space-y-2">
              {NIVEIS_ATIVIDADE.map(nivel => (
                <button key={nivel.id} onClick={() => { setNivel(nivel.id); setRotinaAnalise(null); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${nivel_atividade === nivel.id ? "bg-indigo-600/10 border-indigo-500" : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${nivel_atividade === nivel.id ? "text-indigo-300" : "text-white"}`}>
                        {nivel.label} <span className="ml-1 text-xs font-normal text-gray-500">×{nivel.fator}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{nivel.descricao}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${nivel_atividade === nivel.id ? "border-indigo-500 bg-indigo-500" : "border-gray-600"}`} />
                  </div>
                </button>
              ))}
            </div>

            {erros.nivel_atividade && <p className="text-red-400 text-xs">{erros.nivel_atividade}</p>}

            {/* Descrição de rotina + análise Claude (se tiver API key) */}
            {temApiKey && (
              <div className="border-t border-gray-800 pt-5">
                <p className="text-sm font-medium text-gray-300 mb-1">Reanalisar com Claude</p>
                <p className="text-xs text-gray-500 mb-3">Descreva sua rotina e o Claude vai identificar o nível mais adequado.</p>
                <textarea
                  value={rotina_descrita}
                  onChange={e => { setRotina(e.target.value); setRotinaAnalise(null); }}
                  rows={3}
                  placeholder="Ex: Trabalho sentado, academia 3x por semana, caminhada nos fins de semana..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder-gray-600"
                />
                {!rotinaAnalise ? (
                  <button
                    onClick={analisarRotina}
                    disabled={analisandoRotina || rotina_descrita.trim().length < 20}
                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {analisandoRotina ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {analisandoRotina ? "Analisando..." : "Analisar com Claude"}
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-800 rounded-xl">
                    <p className="text-xs text-emerald-400 font-semibold mb-1">Análise concluída</p>
                    <p className="text-xs text-emerald-300">{rotinaAnalise.justificativa}</p>
                    <button onClick={() => setRotinaAnalise(null)} className="text-xs text-gray-600 hover:text-gray-400 mt-2 transition-colors">Reanalisar</button>
                  </div>
                )}
                {erros.rotina && <p className="text-red-400 text-xs mt-1">{erros.rotina}</p>}
              </div>
            )}

            {tmb > 0 && nivel_atividade && (
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">TMB</p>
                  <p className="text-xl font-bold text-white">{tmb.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">kcal/dia</p>
                </div>
                <div className="flex-1 bg-indigo-950/50 border border-indigo-900 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-400 mb-0.5">TDEE</p>
                  <p className="text-xl font-bold text-indigo-300">{tdee.toLocaleString()}</p>
                  <p className="text-xs text-indigo-600">kcal/dia</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── OBJETIVO ──────────────────────────────────────────────────── */}
        {secao === "objetivo" && (
          <div className="space-y-5">
            <h4 className="text-white font-semibold">Objetivos</h4>
            <p className="text-gray-400 text-sm">Descreva livremente o que você quer alcançar.</p>
            <textarea
              value={objetivo_texto}
              onChange={e => setObjetivo(e.target.value)}
              rows={6}
              placeholder="Ex: Quero perder gordura abdominal e ficar mais definido..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder-gray-600"
            />
            <div className="flex items-center justify-between">
              {erros.objetivo_texto ? <p className="text-red-400 text-xs">{erros.objetivo_texto}</p> : <span />}
              <p className={`text-xs ${objetivo_texto.length < 20 ? "text-gray-600" : "text-gray-500"}`}>{objetivo_texto.length} caracteres</p>
            </div>
          </div>
        )}

        {/* ── PLANO & MACROS ────────────────────────────────────────────── */}
        {secao === "macros" && (
          <div className="space-y-6">
            <h4 className="text-white font-semibold">Plano & Macros</h4>

            {tdee > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400">TDEE atual: <strong className="text-white">{tdee.toLocaleString()} kcal/dia</strong></p>
              </div>
            )}

            <div className="space-y-2">
              {PLANOS.map(plano => {
                const cal = Math.max(tdee - plano.deficit, 1200);
                const selecionado = plano_tipo === plano.id;
                return (
                  <button key={plano.id} onClick={() => selecionarPlano(plano.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selecionado ? `bg-${plano.cor}-600/10 border-${plano.cor}-500` : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${selecionado ? `text-${plano.cor}-300` : "text-white"}`}>{plano.label}</p>
                        <p className="text-xs text-gray-500">{plano.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${selecionado ? `text-${plano.cor}-300` : "text-white"}`}>{Math.round(cal).toLocaleString()} kcal</p>
                        <p className="text-xs text-gray-500">−{plano.deficit} kcal déficit</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {erros.plano_tipo && <p className="text-red-400 text-xs">{erros.plano_tipo}</p>}

            {/* Editor de macros */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-white">Ajuste os Macros</p>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">interativo</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Edite calorias ou macros — os valores se ajustam automaticamente.</p>

              <div className="mb-4 p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Calorias Totais</span>
                  {tdee > 0 && <span className="text-xs text-gray-500">TDEE: {tdee.toLocaleString()} kcal</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => ajustarCalorias(meta_calorias - 50)} className="w-8 h-8 rounded-lg bg-gray-700 text-white text-lg font-bold hover:bg-gray-600 flex items-center justify-center">−</button>
                  <input type="number" value={meta_calorias} onChange={e => ajustarCalorias(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-transparent text-2xl font-bold text-indigo-300 text-center focus:outline-none" />
                  <button onClick={() => ajustarCalorias(meta_calorias + 50)} className="w-8 h-8 rounded-lg bg-gray-700 text-white text-lg font-bold hover:bg-gray-600 flex items-center justify-center">+</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "proteina" as const, label: "Proteína",    value: meta_proteina_g,    cor: "blue",  cal: 4 },
                  { key: "carbo" as const,    label: "Carboidrato", value: meta_carboidrato_g, cor: "amber", cal: 4 },
                  { key: "gordura" as const,  label: "Gordura",     value: meta_gordura_g,     cor: "rose",  cal: 9 },
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
                  const total = meta_proteina_g * 4 + meta_carboidrato_g * 4 + meta_gordura_g * 9;
                  if (!total) return null;
                  return [
                    { pct: (meta_proteina_g * 4 / total) * 100, cor: "bg-blue-500" },
                    { pct: (meta_carboidrato_g * 4 / total) * 100, cor: "bg-amber-500" },
                    { pct: (meta_gordura_g * 9 / total) * 100, cor: "bg-rose-500" },
                  ].map((b, i) => <div key={i} style={{ width: `${b.pct}%` }} className={`${b.cor} transition-all`} />);
                })()}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Prot {Math.round(meta_proteina_g * 4 / Math.max(meta_calorias, 1) * 100)}%</span>
                <span>Carbo {Math.round(meta_carboidrato_g * 4 / Math.max(meta_calorias, 1) * 100)}%</span>
                <span>Gord {Math.round(meta_gordura_g * 9 / Math.max(meta_calorias, 1) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── INTEGRAÇÃO CLAUDE ─────────────────────────────────────────── */}
        {secao === "claude" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 rounded-xl">
                <Key size={16} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Integração com Claude</h4>
                <p className="text-gray-500 text-sm">API key da Anthropic para análises inteligentes</p>
              </div>
            </div>

            {temApiKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-800 rounded-xl">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-emerald-300 font-medium">API Key configurada</p>
                    <p className="text-xs text-emerald-600 mt-0.5">O Claude está ativo para análises de saúde.</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Atualizar chave</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder="sk-ant-api03-..."
                        value={apiKeyInput}
                        onChange={e => { setApiKeyInput(e.target.value); setTestStatus("idle"); }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button onClick={() => setApiKeyVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.readText().then(t => { setApiKeyInput(t); setTestStatus("idle"); }).catch(() => {})}
                      className="px-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
                      title="Colar da área de transferência"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={testarKey}
                    disabled={!apiKeyInput.trim() || testStatus === "testing"}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {testStatus === "testing" && <Loader2 size={14} className="animate-spin" />}
                    {testStatus === "ok" && <CheckCircle size={14} className="text-emerald-400" />}
                    {testStatus === "error" && <XCircle size={14} className="text-red-400" />}
                    {testStatus === "testing" ? "Testando..." : testStatus === "ok" ? "Chave válida ✓" : "Testar nova chave"}
                  </button>
                  {testStatus === "ok" && (
                    <button
                      onClick={salvarApiKey}
                      disabled={salvando}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                    >
                      {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Salvar nova chave
                    </button>
                  )}
                </div>

                {testStatus === "error" && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-2">
                    <XCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-300">{testError}</p>
                  </div>
                )}

                <div className="border-t border-gray-800 pt-4">
                  <button
                    onClick={removerApiKey}
                    disabled={salvando}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 border border-transparent hover:border-red-900 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Remover API Key
                  </button>
                  <p className="text-xs text-gray-600 mt-1 ml-0.5">Isso desativará as análises do Claude até que uma nova chave seja adicionada.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Sem API Key configurada. As análises inteligentes estão desativadas.</p>
                  <ul className="space-y-1.5">
                    {[
                      "Análise personalizada do seu objetivo",
                      "Classificação automática do nível de atividade",
                      "Insights e sugestões de melhoria",
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                        <Sparkles size={11} className="text-gray-600 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink size={14} />
                  Criar API Key em console.anthropic.com
                </a>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Cole sua API Key</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder="sk-ant-api03-..."
                        value={apiKeyInput}
                        onChange={e => { setApiKeyInput(e.target.value); setTestStatus("idle"); }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button onClick={() => setApiKeyVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.readText().then(t => { setApiKeyInput(t); setTestStatus("idle"); }).catch(() => {})}
                      className="px-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={testarKey}
                    disabled={!apiKeyInput.trim() || testStatus === "testing"}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {testStatus === "testing" && <Loader2 size={14} className="animate-spin" />}
                    {testStatus === "ok" && <CheckCircle size={14} className="text-emerald-400" />}
                    {testStatus === "error" && <XCircle size={14} className="text-red-400" />}
                    {testStatus === "testing" ? "Testando..." : testStatus === "ok" ? "Chave válida ✓" : "Testar conexão"}
                  </button>
                  {testStatus === "ok" && (
                    <button
                      onClick={salvarApiKey}
                      disabled={salvando}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Ativar Claude
                    </button>
                  )}
                </div>

                {testStatus === "ok" && (
                  <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded-xl flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-300">Conexão estabelecida! Clique em &quot;Ativar Claude&quot; para salvar.</p>
                  </div>
                )}

                {testStatus === "error" && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-2">
                    <XCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-300">{testError}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <p className="text-xs text-gray-500">🔒 Sua chave é armazenada de forma segura e usada apenas para processar suas solicitações.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
