"use client";

import { useState } from "react";
import { Parcelamento, Cartao } from "@/lib/financeiro-types";
import { MESES_LABELS, CATEGORIAS_PADRAO } from "@/lib/financeiro-data";
import { X } from "lucide-react";

interface Props {
  cartoes: Cartao[];
  cartaoPreSelecionado?: string;
  onSalvar: (p: Parcelamento) => void;
  onFechar: () => void;
}

export default function ModalParcelamento({ cartoes, cartaoPreSelecionado, onSalvar, onFechar }: Props) {
  const [cartaoId, setCartaoId] = useState(cartaoPreSelecionado ?? cartoes[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [valorTotal, setValorTotal] = useState("");
  const [totalParcelas, setTotalParcelas] = useState("1");
  const [mesInicio, setMesInicio] = useState(new Date().getMonth());

  const valorNum = parseFloat(valorTotal.replace(",", ".")) || 0;
  const parcelasNum = parseInt(totalParcelas) || 1;
  const valorParcela = parcelasNum > 0 ? valorNum / parcelasNum : 0;

  const podeSalvar = descricao.trim() && valorNum > 0 && parcelasNum > 0;

  function handleSalvar() {
    if (!podeSalvar) return;
    onSalvar({
      id: `parc-${Date.now()}`,
      cartaoId,
      descricao: descricao.trim(),
      categoria,
      valorTotal: valorNum,
      totalParcelas: parcelasNum,
      mesInicio,
      valorParcela,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Novo parcelamento</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Cartão */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Cartão</label>
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

          {/* Descrição */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Descrição</label>
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
              {CATEGORIAS_PADRAO.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Valor e parcelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Valor total</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  type="number"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Nº de parcelas</label>
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

          {/* Preview da parcela */}
          {valorNum > 0 && parcelasNum > 0 && (
            <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-indigo-300">Valor por parcela</span>
              <span className="text-sm font-bold text-indigo-200">
                {parcelasNum}x de {valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}

          {/* Mês de início */}
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
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
