"use client";

import { useState } from "react";
import {
  LinhaFinanceira,
  MESES,
  MESES_KEYS,
  calcularTotalMes,
  formatBRL,
} from "@/lib/financeiro-data";
import { Check, Plus, Pencil, Trash2 } from "lucide-react";
import ModalLinha from "./ModalLinha";

interface Props {
  linhas: LinhaFinanceira[];
  onChange: (linhas: LinhaFinanceira[]) => void;
}

export default function ProjecaoAnual({ linhas, onChange }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [linhaSelecionada, setLinhaSelecionada] = useState<LinhaFinanceira | null>(null);

  const gastos = linhas.filter((l) => l.tipo === "gasto");

  function togglePago(linhaId: string, mes: string) {
    onChange(
      linhas.map((l) =>
        l.id === linhaId
          ? { ...l, pagos: { ...l.pagos, [mes]: !l.pagos[mes] } }
          : l
      )
    );
  }

  function excluirLinha(linhaId: string) {
    onChange(linhas.filter((l) => l.id !== linhaId));
  }

  function salvarLinha(linha: LinhaFinanceira) {
    const existe = linhas.find((l) => l.id === linha.id);
    if (existe) {
      onChange(linhas.map((l) => (l.id === linha.id ? linha : l)));
    } else {
      onChange([...linhas, linha]);
    }
    setModalAberto(false);
    setLinhaSelecionada(null);
  }

  function abrirEdicao(linha: LinhaFinanceira) {
    setLinhaSelecionada(linha);
    setModalAberto(true);
  }

  function abrirNovo() {
    setLinhaSelecionada(null);
    setModalAberto(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Projeção 2026</h3>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nova linha
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium w-44 sticky left-0 bg-gray-800 z-10">
                Item
              </th>
              {MESES.map((m) => (
                <th key={m} className="text-center px-3 py-3 text-gray-400 font-medium whitespace-nowrap min-w-[110px]">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gastos.map((linha) => (
              <LinhaRow
                key={linha.id}
                linha={linha}
                onToggle={togglePago}
                onEdit={abrirEdicao}
                onDelete={excluirLinha}
                corPago="bg-emerald-900/60 text-emerald-300"
              />
            ))}
            <TotalRow label="Total Gastos Fixos" linhas={gastos} cor="text-red-400 font-semibold" bgCor="bg-red-950/20" />
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <ModalLinha
          linha={linhaSelecionada}
          onSalvar={salvarLinha}
          onFechar={() => { setModalAberto(false); setLinhaSelecionada(null); }}
        />
      )}
    </div>
  );
}

function LinhaRow({
  linha,
  onToggle,
  onEdit,
  onDelete,
  corPago,
}: {
  linha: LinhaFinanceira;
  onToggle: (id: string, mes: string) => void;
  onEdit: (linha: LinhaFinanceira) => void;
  onDelete: (id: string) => void;
  corPago: string;
}) {
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-800/40 group">
      <td className="px-4 py-2 text-gray-200 sticky left-0 bg-gray-900 group-hover:bg-gray-800/80 z-10">
        <div className="flex items-center justify-between gap-2">
          <span>{linha.nome}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(linha)} className="text-gray-500 hover:text-white p-0.5 rounded">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(linha.id)} className="text-gray-500 hover:text-red-400 p-0.5 rounded">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </td>
      {MESES_KEYS.map((mes) => {
        const valor = linha.valores[mes] ?? 0;
        const pago = !!linha.pagos[mes];
        return (
          <td key={mes} className="text-center px-2 py-2">
            <button
              onClick={() => valor > 0 && onToggle(linha.id, mes)}
              className={`w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                valor === 0
                  ? "text-gray-700 cursor-default"
                  : pago
                  ? corPago + " cursor-pointer"
                  : "text-gray-300 hover:bg-gray-700 cursor-pointer"
              }`}
            >
              {valor === 0 ? "—" : (
                <span className="flex items-center justify-center gap-1">
                  {pago && <Check size={11} />}
                  {formatBRL(valor)}
                </span>
              )}
            </button>
          </td>
        );
      })}
    </tr>
  );
}

function TotalRow({
  label,
  linhas,
  cor,
  bgCor,
}: {
  label: string;
  linhas: LinhaFinanceira[];
  cor: string;
  bgCor: string;
}) {
  return (
    <tr className={`border-t border-gray-700 ${bgCor}`}>
      <td className={`px-4 py-2.5 sticky left-0 ${bgCor} ${cor}`}>{label}</td>
      {MESES_KEYS.map((mes) => (
        <td key={mes} className={`text-center px-3 py-2.5 ${cor}`}>
          {formatBRL(calcularTotalMes(linhas, linhas[0]?.tipo ?? "gasto", mes))}
        </td>
      ))}
    </tr>
  );
}
