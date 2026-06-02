"use client";

import { useState } from "react";
import {
  LinhaFinanceira,
  MESES_KEYS,
  MESES_LABELS,
  CATEGORIAS_PADRAO,
} from "@/lib/financeiro-data";
import { X, Plus, Tag } from "lucide-react";

interface Props {
  categorias: string[];
  onSalvar: (linha: LinhaFinanceira, novaCategoria?: string) => void;
  onFechar: () => void;
}

type Duracao = "sem-fim" | "ate-mes";

export default function ModalDespesa({ categorias, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? "Outros");
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [duracao, setDuracao] = useState<Duracao>("sem-fim");
  const [mesInicio, setMesInicio] = useState(new Date().getMonth()); // 0-based
  const [mesFim, setMesFim] = useState(11); // dezembro por padrão
  const [diaVencimento, setDiaVencimento] = useState("");

  const categoriaFinal = criandoCategoria ? novaCategoria.trim() : categoria;

  function handleSalvar() {
    if (!nome.trim() || !categoriaFinal || !valor) return;

    const valorNum = parseFloat(valor.replace(",", ".")) || 0;

    const valores: Record<string, number> = {};
    MESES_KEYS.forEach((m, i) => {
      const ativo =
        i >= mesInicio && (duracao === "sem-fim" || i <= mesFim);
      valores[m] = ativo ? valorNum : 0;
    });

    const diaNum = parseInt(diaVencimento);
    onSalvar(
      {
        id: `despesa-${Date.now()}`,
        nome: nome.trim(),
        tipo: "gasto",
        categoria: categoriaFinal,
        diaVencimento: diaNum >= 1 && diaNum <= 31 ? diaNum : undefined,
        valores,
        pagos: {},
      },
      criandoCategoria ? categoriaFinal : undefined
    );
  }

  const podeSalvar =
    nome.trim() &&
    (criandoCategoria ? novaCategoria.trim() : true) &&
    valor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Nova despesa fixa</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Título
            </label>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              placeholder="Ex: Aluguel, Plano de saúde..."
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Categoria
            </label>

            {!criandoCategoria ? (
              <div className="flex gap-2">
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCriandoCategoria(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl text-gray-400 hover:text-indigo-400 text-sm transition-colors whitespace-nowrap"
                >
                  <Plus size={15} /> Nova
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    autoFocus
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    className="w-full bg-gray-800 border border-indigo-500 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm focus:outline-none placeholder:text-gray-600"
                    placeholder="Nome da nova categoria"
                  />
                </div>
                <button
                  onClick={() => { setCriandoCategoria(false); setNovaCategoria(""); }}
                  className="px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Valor mensal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Dia de vencimento */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Dia de vencimento <span className="normal-case text-gray-600">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
                placeholder="Ex: 10"
                min="1"
                max="31"
              />
              <span className="text-sm text-gray-500">de cada mês</span>
            </div>
          </div>

          {/* Mês de início */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Começa em
            </label>
            <select
              value={mesInicio}
              onChange={(e) => setMesInicio(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {MESES_LABELS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>

          {/* Duração */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Duração
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDuracao("sem-fim")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  duracao === "sem-fim"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Sem fim
              </button>
              <button
                onClick={() => setDuracao("ate-mes")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  duracao === "ate-mes"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Até um mês
              </button>
            </div>

            {duracao === "ate-mes" && (
              <select
                value={mesFim}
                onChange={(e) => setMesFim(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {MESES_LABELS.map((m, i) => (
                  <option key={m} value={i} disabled={i < mesInicio}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={!podeSalvar}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Salvar despesa
          </button>
        </div>
      </div>
    </div>
  );
}
