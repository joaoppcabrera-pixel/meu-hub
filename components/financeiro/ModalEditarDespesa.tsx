"use client";

import { useState } from "react";
import {
  LinhaFinanceira,
  MESES,
  MESES_KEYS,
  MESES_LABELS,
  formatBRL,
} from "@/lib/financeiro-data";
import { X, Tag, Plus } from "lucide-react";

interface Props {
  linha: LinhaFinanceira;
  mesAtual: string; // ex: "jun"
  categorias: string[];
  onSalvar: (linha: LinhaFinanceira, novaCategoria?: string) => void;
  onFechar: () => void;
}

type Escopo = "so-este-mes" | "este-e-seguintes";
type Duracao = "sem-fim" | "ate-mes";

export default function ModalEditarDespesa({ linha, mesAtual, categorias, onSalvar, onFechar }: Props) {
  const mesAtualIdx = MESES_KEYS.indexOf(mesAtual);

  const [escopo, setEscopo] = useState<Escopo>("este-e-seguintes");
  const [nome, setNome] = useState(linha.nome);
  const [categoria, setCategoria] = useState(linha.categoria ?? categorias[0]);
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [diaVencimento, setDiaVencimento] = useState(linha.diaVencimento?.toString() ?? "");
  const [novaCategoria, setNovaCategoria] = useState("");

  // Valor: pega o valor do mês atual como ponto de partida
  const [valor, setValor] = useState(
    (linha.valores[mesAtual] ?? 0).toString()
  );

  // Duração: detecta o mês de fim atual
  const ultimoMesComValor = MESES_KEYS.reduce((ultimo, m, i) =>
    (linha.valores[m] ?? 0) > 0 ? i : ultimo, -1);

  const [duracao, setDuracao] = useState<Duracao>(
    ultimoMesComValor === 11 || ultimoMesComValor === -1 ? "sem-fim" : "ate-mes"
  );
  const [mesFim, setMesFim] = useState(
    ultimoMesComValor >= mesAtualIdx ? ultimoMesComValor : 11
  );

  const categoriaFinal = criandoCategoria ? novaCategoria.trim() : categoria;
  const podeSalvar = nome.trim() && (criandoCategoria ? novaCategoria.trim() : true) && valor;

  function handleSalvar() {
    if (!podeSalvar) return;

    const valorNum = parseFloat(valor.replace(",", ".")) || 0;
    const novosValores = { ...linha.valores };
    const novosPagos = { ...linha.pagos };

    if (escopo === "so-este-mes") {
      // Altera apenas o mês atual
      novosValores[mesAtual] = valorNum;
    } else {
      // Altera do mês atual em diante
      MESES_KEYS.forEach((m, i) => {
        if (i < mesAtualIdx) return; // mantém meses anteriores intactos
        const ativo = duracao === "sem-fim" || i <= mesFim;
        novosValores[m] = ativo ? valorNum : 0;
        // Se zerou o valor, remove o "pago" para não confundir
        if (!ativo) delete novosPagos[m];
      });
    }

    const diaNum = parseInt(diaVencimento);
    const diaFinal = diaNum >= 1 && diaNum <= 31 ? diaNum : undefined;

    onSalvar(
      {
        ...linha,
        nome: escopo === "so-este-mes" ? linha.nome : nome.trim(),
        categoria: escopo === "so-este-mes" ? linha.categoria : categoriaFinal,
        diaVencimento: escopo === "so-este-mes" ? linha.diaVencimento : diaFinal,
        valores: novosValores,
        pagos: novosPagos,
      },
      criandoCategoria ? categoriaFinal : undefined
    );
  }

  const mesAtualLabel = MESES[mesAtualIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold text-lg">Editar despesa</h3>
            <p className="text-gray-500 text-xs mt-0.5">{linha.nome}</p>
          </div>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Escopo da edição */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Aplicar alteração
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setEscopo("so-este-mes")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors text-center ${
                  escopo === "so-este-mes"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Só {mesAtualLabel}
              </button>
              <button
                onClick={() => setEscopo("este-e-seguintes")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors text-center ${
                  escopo === "este-e-seguintes"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {mesAtualLabel} em diante
              </button>
            </div>
          </div>

          {/* Valor — sempre editável */}
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
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                min="0"
                step="0.01"
              />
            </div>
            {escopo === "so-este-mes" && (
              <p className="text-xs text-gray-500 mt-1.5">
                Valor atual nos outros meses: {formatBRL(linha.valores[MESES_KEYS.find(m => m !== mesAtual && (linha.valores[m] ?? 0) > 0) ?? mesAtual] ?? 0)}
              </p>
            )}
          </div>

          {/* Campos extras — só para "este e seguintes" */}
          {escopo === "este-e-seguintes" && (
            <>
              {/* Nome */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Título
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
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
                      {categorias.map((c) => <option key={c}>{c}</option>)}
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
                        className="w-full bg-gray-800 border border-indigo-500 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm focus:outline-none"
                        placeholder="Nome da nova categoria"
                      />
                    </div>
                    <button
                      onClick={() => { setCriandoCategoria(false); setNovaCategoria(""); }}
                      className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
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

              {/* Duração */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Duração
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setDuracao("sem-fim")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      duracao === "sem-fim" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Sem fim
                  </button>
                  <button
                    onClick={() => setDuracao("ate-mes")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      duracao === "ate-mes" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
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
                      <option key={m} value={i} disabled={i < mesAtualIdx}>{m}</option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
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
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
