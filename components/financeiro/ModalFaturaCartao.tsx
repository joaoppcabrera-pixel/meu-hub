"use client";

import { useState } from "react";
import { Cartao } from "@/lib/financeiro-types";
import { LinhaFinanceira, MESES_KEYS } from "@/lib/financeiro-data";
import { X, CreditCard } from "lucide-react";

interface Props {
  cartoes: Cartao[];
  onSalvar: (linha: LinhaFinanceira) => void;
  onFechar: () => void;
}

export default function ModalFaturaCartao({ cartoes, onSalvar, onFechar }: Props) {
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id ?? "");

  const cartao = cartoes.find((c) => c.id === cartaoId);

  function handleSalvar() {
    if (!cartaoId || !cartao) return;
    onSalvar({
      id: `fatura-${cartaoId}-${Date.now()}`,
      nome: `Fatura ${cartao.nome}`,
      tipo: "gasto",
      categoria: "Cartões",
      cartaoVinculadoId: cartaoId,
      diaVencimento: cartao.diaVencimento,
      // valores vazios — serão substituídos pela fatura calculada em runtime
      valores: Object.fromEntries(MESES_KEYS.map((m) => [m, 0])),
      pagos: {},
      pagosContas: {},
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Fatura do cartão</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            Cria uma linha de gasto fixo cujo valor é calculado automaticamente a partir da fatura do cartão selecionado.
          </p>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Cartão</label>
            <div className="flex flex-col gap-2">
              {cartoes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCartaoId(c.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    cartaoId === c.id
                      ? "border-indigo-500 bg-indigo-950/30"
                      : "border-gray-700 hover:border-gray-600 bg-gray-800/40"
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${c.cor} shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-white">{c.nome}</p>
                    <p className="text-xs text-gray-500">
                      Fecha dia {c.diaFechamento} · Vence dia {c.diaVencimento}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {cartao && (
            <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-800/40 rounded-xl px-4 py-3">
              <CreditCard size={16} className="text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-300">
                Criará <strong>"Fatura {cartao.nome}"</strong> nos gastos fixos. O valor atualiza automaticamente conforme parcelamentos, assinaturas e gastos variáveis do cartão.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={!cartaoId}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
