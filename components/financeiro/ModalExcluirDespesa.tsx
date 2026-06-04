"use client";

import { useState } from "react";
import { LinhaFinanceira, MESES, MESES_KEYS } from "@/lib/financeiro-data";
import { X, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  linha: LinhaFinanceira;
  mesAtual: string;
  onConfirmar: (linhaAtualizada: LinhaFinanceira) => void;
  onFechar: () => void;
}

type Escopo = "so-este-mes" | "deste-mes-em-diante";

export default function ModalExcluirDespesa({ linha, mesAtual, onConfirmar, onFechar }: Props) {
  const [escopo, setEscopo] = useState<Escopo>("deste-mes-em-diante");

  const mesAtualIdx = MESES_KEYS.indexOf(mesAtual);
  const mesAtualLabel = MESES[mesAtualIdx];

  function handleConfirmar() {
    const novosValores = { ...linha.valores };
    const novosPagos = { ...linha.pagos };

    if (escopo === "so-este-mes") {
      novosValores[mesAtual] = 0;
      delete novosPagos[mesAtual];
    } else {
      MESES_KEYS.forEach((m, i) => {
        if (i >= mesAtualIdx) {
          novosValores[m] = 0;
          delete novosPagos[m];
        }
      });
    }

    onConfirmar({ ...linha, valores: novosValores, pagos: novosPagos });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <h3 className="text-white font-semibold">Excluir despesa</h3>
          </div>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            Como deseja excluir <span className="text-white font-medium">"{linha.nome}"</span>?
          </p>

          {/* Opções */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setEscopo("so-este-mes")}
              className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors ${
                escopo === "so-este-mes"
                  ? "border-red-500/60 bg-red-950/30"
                  : "border-gray-700 hover:border-gray-600 bg-gray-800/40"
              }`}
            >
              <span className="text-sm font-medium text-white">Só em {mesAtualLabel}</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Remove apenas o valor deste mês. Meses anteriores e futuros permanecem.
              </span>
            </button>

            <button
              onClick={() => setEscopo("deste-mes-em-diante")}
              className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors ${
                escopo === "deste-mes-em-diante"
                  ? "border-red-500/60 bg-red-950/30"
                  : "border-gray-700 hover:border-gray-600 bg-gray-800/40"
              }`}
            >
              <span className="text-sm font-medium text-white">{mesAtualLabel} em diante</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Zera de {mesAtualLabel} até dezembro. Histórico anterior é preservado.
              </span>
            </button>
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
            onClick={handleConfirmar}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            <Trash2 size={15} /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
