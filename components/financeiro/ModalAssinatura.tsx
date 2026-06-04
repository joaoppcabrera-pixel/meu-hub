"use client";

import { useState } from "react";
import { Assinatura, Cartao } from "@/lib/financeiro-types";
import { MESES_LABELS, CATEGORIAS_PADRAO } from "@/lib/financeiro-data";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { X } from "lucide-react";

interface Props {
  cartoes: Cartao[];
  cartaoPreSelecionado?: string;
  assinaturaEditar?: Assinatura;
  onSalvar: (a: Assinatura) => void;
  onFechar: () => void;
}

export default function ModalAssinatura({ cartoes, cartaoPreSelecionado, assinaturaEditar, onSalvar, onFechar }: Props) {
  const isEdicao = !!assinaturaEditar;
  const [cartaoId, setCartaoId] = useState(assinaturaEditar?.cartaoId ?? cartaoPreSelecionado ?? cartoes[0]?.id ?? "");
  const [descricao, setDescricao] = useState(assinaturaEditar?.descricao ?? "");
  const [categoria, setCategoria] = useState(assinaturaEditar?.categoria ?? CATEGORIAS_PADRAO[0]);
  const [valor, setValor] = useState(assinaturaEditar?.valor ?? 0);
  const [diaCobranca, setDiaCobranca] = useState(String(assinaturaEditar?.diaCobranca ?? ""));
  const [mesInicio, setMesInicio] = useState(assinaturaEditar?.mesInicio ?? new Date().getMonth());

  const podeSalvar = descricao.trim() && valor > 0 && parseInt(diaCobranca) >= 1;

  function handleSalvar() {
    if (!podeSalvar) return;
    onSalvar({
      id: assinaturaEditar?.id ?? `ass-${Date.now()}`,
      cartaoId,
      descricao: descricao.trim(),
      categoria,
      valor,
      diaCobranca: parseInt(diaCobranca),
      mesInicio,
      mesFim: assinaturaEditar?.mesFim,
      ativa: assinaturaEditar?.ativa ?? true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{isEdicao ? "Editar assinatura" : "Nova assinatura"}</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
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
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Serviço</label>
            <input
              autoFocus
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              placeholder="Ex: Netflix, Spotify, iCloud..."
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

          {/* Valor e Dia de cobrança */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Valor mensal</label>
              <CurrencyInput value={valor} onChange={setValor} />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Dia de cobrança</label>
              <input
                type="number"
                value={diaCobranca}
                onChange={(e) => setDiaCobranca(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
                placeholder="Ex: 15"
                min="1" max="31"
              />
            </div>
          </div>

          {/* Mês de início */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Começa em</label>
            <select
              value={mesInicio}
              onChange={(e) => setMesInicio(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {MESES_LABELS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>

          {/* Info */}
          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-4 py-3 text-xs text-indigo-300">
            Cobrado todo mês até você cancelar. Aparece na fatura de cada mês automaticamente.
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={!podeSalvar}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            {isEdicao ? "Salvar alterações" : "Salvar assinatura"}
          </button>
        </div>
      </div>
    </div>
  );
}
