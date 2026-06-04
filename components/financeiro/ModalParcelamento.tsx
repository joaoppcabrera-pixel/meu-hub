"use client";

import { useState } from "react";
import { Parcelamento, Cartao } from "@/lib/financeiro-types";
import { MESES_LABELS, CATEGORIAS_PADRAO } from "@/lib/financeiro-data";
import { X } from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface Props {
  cartoes: Cartao[];
  categorias: string[];
  cartaoPreSelecionado?: string;
  parcelamentoEditar?: Parcelamento;
  onSalvar: (p: Parcelamento) => void;
  onFechar: () => void;
}

export default function ModalParcelamento({ cartoes, categorias, cartaoPreSelecionado, parcelamentoEditar, onSalvar, onFechar }: Props) {
  const isEdicao = !!parcelamentoEditar;
  const [cartaoId, setCartaoId] = useState(parcelamentoEditar?.cartaoId ?? cartaoPreSelecionado ?? cartoes[0]?.id ?? "");
  const [descricao, setDescricao] = useState(parcelamentoEditar?.descricao ?? "");
  const [categoria, setCategoria] = useState(parcelamentoEditar?.categoria ?? categorias[0] ?? "");
  const [valorParcela, setValorParcela] = useState(parcelamentoEditar?.valorParcela ?? 0);
  const [totalParcelas, setTotalParcelas] = useState(String(parcelamentoEditar?.totalParcelas ?? 1));
  const [mesInicio, setMesInicio] = useState(parcelamentoEditar?.mesInicio ?? new Date().getMonth());

  const parcelasNum = parseInt(totalParcelas) || 1;
  const valorTotal = valorParcela * parcelasNum;

  const podeSalvar = descricao.trim() && valorParcela > 0 && parcelasNum > 0;

  function handleSalvar() {
    if (!podeSalvar) return;
    onSalvar({
      id: parcelamentoEditar?.id ?? `parc-${Date.now()}`,
      cartaoId,
      descricao: descricao.trim(),
      categoria,
      valorTotal,
      totalParcelas: parcelasNum,
      mesInicio,
      valorParcela,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{isEdicao ? "Editar parcelamento" : "Novo parcelamento"}</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* CartÃ£o */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">CartÃ£o</label>
            <div className="flex gap-2">
              {cartoes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCartaoId(c.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    cartaoId === c.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </div>

          {/* DescriÃ§Ã£o */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">DescriÃ§Ã£o</label>
            <input
              autoFocus
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              placeholder="Ex: iPhone 16, Notebook..."
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {categorias.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Valor e parcelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Valor da parcela</label>
              <CurrencyInput value={valorParcela} onChange={setValorParcela} />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">NÂº de parcelas</label>
              <input
                type="number"
                value={totalParcelas}
                onChange={(e) => setTotalParcelas(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                min="1"
                max="60"
              />
            </div>
          </div>

          {/* Preview do total */}
          {valorParcela > 0 && parcelasNum > 0 && (
            <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-indigo-300">Total da compra</span>
              <span className="text-sm font-bold text-indigo-200">
                {parcelasNum}x de {valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} = {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}

          {/* MÃªs de inÃ­cio */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Primeira parcela em</label>
            <select
              value={mesInicio}
              onChange={(e) => setMesInicio(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {MESES_LABELS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">Cancelar</button>
          <button
            onClick={handleSalvar}
            disabled={!podeSalvar}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            {isEdicao ? "Salvar alteraÃ§Ãµes" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}


