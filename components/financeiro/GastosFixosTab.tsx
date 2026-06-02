"use client";

import { useState } from "react";
import { LinhaFinanceira, CATEGORIAS_PADRAO } from "@/lib/financeiro-data";
import ProjecaoAnual from "./ProjecaoAnual";
import ResumoMes from "./ResumoMes";
import GastosMes from "./GastosMes";
import ModalDespesa from "./ModalDespesa";
import { ChevronDown, ChevronUp, TableProperties, Plus } from "lucide-react";

interface Props {
  linhas: LinhaFinanceira[];
  categorias: string[];
  onChange: (linhas: LinhaFinanceira[]) => void;
  onNovaCategoriaFixa: (cat: string) => void;
}

export default function GastosFixosTab({ linhas, categorias, onChange, onNovaCategoriaFixa }: Props) {
  const [tabelaAberta, setTabelaAberta] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  function handleSalvarDespesa(linha: LinhaFinanceira, novaCategoria?: string) {
    if (novaCategoria) onNovaCategoriaFixa(novaCategoria);
    onChange([...linhas, linha]);
    setModalAberto(false);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Gastos Fixos</h3>
          <p className="text-gray-400 text-sm mt-0.5">Despesas mensais recorrentes e projeção anual</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nova despesa fixa
        </button>
      </div>

      <ResumoMes linhas={linhas} />
      <GastosMes linhas={linhas} categorias={categorias} onChange={onChange} />

      <div className="mt-2">
        <button
          onClick={() => setTabelaAberta(!tabelaAberta)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <TableProperties size={16} className="text-indigo-400" />
          <span className="font-medium">Projeção anual completa</span>
          {tabelaAberta ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>
        {tabelaAberta && <ProjecaoAnual linhas={linhas} onChange={onChange} />}
      </div>

      {modalAberto && (
        <ModalDespesa
          categorias={categorias}
          onSalvar={handleSalvarDespesa}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
