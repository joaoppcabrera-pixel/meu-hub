"use client";

import { useState } from "react";
import { LinhaFinanceira, MESES, MESES_KEYS, formatBRL } from "@/lib/financeiro-data";
import { List, LayoutGrid, Check, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import ModalEditarDespesa from "./ModalEditarDespesa";
import ModalExcluirDespesa from "./ModalExcluirDespesa";

interface Props {
  linhas: LinhaFinanceira[];
  categorias: string[];
  onChange: (linhas: LinhaFinanceira[]) => void;
}

const CATEGORIA_CORES: Record<string, { bg: string; text: string }> = {
  Moradia:       { bg: "bg-blue-500/15",    text: "text-blue-400" },
  Impostos:      { bg: "bg-red-500/15",     text: "text-red-400" },
  Saúde:         { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Serviços:      { bg: "bg-yellow-500/15",  text: "text-yellow-400" },
  Cartões:       { bg: "bg-purple-500/15",  text: "text-purple-400" },
  Dívidas:       { bg: "bg-orange-500/15",  text: "text-orange-400" },
  Investimentos: { bg: "bg-indigo-500/15",  text: "text-indigo-400" },
  Outros:        { bg: "bg-gray-500/15",    text: "text-gray-400" },
};

function getCor(cat?: string) {
  return CATEGORIA_CORES[cat ?? "Outros"] ?? CATEGORIA_CORES["Outros"];
}

export default function GastosMes({ linhas, categorias, onChange }: Props) {
  const [modo, setModo] = useState<"lista" | "categoria">("categoria");
  const [linhaSelecionada, setLinhaSelecionada] = useState<LinhaFinanceira | null>(null);
  const [linhaParaExcluir, setLinhaParaExcluir] = useState<LinhaFinanceira | null>(null);

  const mesIdx = new Date().getMonth();
  const mes = MESES_KEYS[mesIdx];
  const mesLabel = MESES[mesIdx];

  const gastos = linhas.filter((l) => l.tipo === "gasto" && (l.valores[mes] ?? 0) > 0);

  function togglePago(linhaId: string) {
    onChange(
      linhas.map((l) =>
        l.id === linhaId ? { ...l, pagos: { ...l.pagos, [mes]: !l.pagos[mes] } } : l
      )
    );
  }

  function handleEditar(linha: LinhaFinanceira, e: React.MouseEvent) {
    e.stopPropagation();
    setLinhaSelecionada(linha);
  }

  function handleExcluir(linha: LinhaFinanceira, e: React.MouseEvent) {
    e.stopPropagation();
    setLinhaParaExcluir(linha);
  }

  function handleConfirmarExclusao(linhaAtualizada: LinhaFinanceira) {
    onChange(linhas.map((l) => (l.id === linhaAtualizada.id ? linhaAtualizada : l)));
    setLinhaParaExcluir(null);
  }

  function handleSalvarEdicao(linhaAtualizada: LinhaFinanceira, novaCategoria?: string) {
    onChange(linhas.map((l) => (l.id === linhaAtualizada.id ? linhaAtualizada : l)));
    setLinhaSelecionada(null);
    // novaCategoria é tratada na página pai via prop de callback se necessário
    // por ora apenas fechamos o modal
  }

  const totalMes = gastos.reduce((acc, l) => acc + (l.valores[mes] ?? 0), 0);
  const totalPago = gastos
    .filter((l) => l.pagos[mes])
    .reduce((acc, l) => acc + (l.valores[mes] ?? 0), 0);
  const percentPago = totalMes > 0 ? (totalPago / totalMes) * 100 : 0;

  return (
    <div className="mb-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Gastos de {mesLabel}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatBRL(totalPago)} pagos de {formatBRL(totalMes)} —{" "}
            <span className={percentPago === 100 ? "text-emerald-400" : "text-gray-400"}>
              {percentPago.toFixed(0)}% quitado
            </span>
          </p>
        </div>
        <div className="flex items-center bg-gray-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => setModo("lista")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              modo === "lista" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <List size={14} /> Lista
          </button>
          <button
            onClick={() => setModo("categoria")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              modo === "categoria" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <LayoutGrid size={14} /> Categoria
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percentPago}%` }}
        />
      </div>

      {modo === "lista" ? (
        <ListaView gastos={gastos} mes={mes} onToggle={togglePago} onEditar={handleEditar} onExcluir={handleExcluir} />
      ) : (
        <CategoriaView gastos={gastos} mes={mes} onToggle={togglePago} onEditar={handleEditar} onExcluir={handleExcluir} />
      )}

      {linhaSelecionada && (
        <ModalEditarDespesa
          linha={linhaSelecionada}
          mesAtual={mes}
          categorias={categorias}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setLinhaSelecionada(null)}
        />
      )}

      {linhaParaExcluir && (
        <ModalExcluirDespesa
          linha={linhaParaExcluir}
          mesAtual={mes}
          onConfirmar={handleConfirmarExclusao}
          onFechar={() => setLinhaParaExcluir(null)}
        />
      )}
    </div>
  );
}

/* ── LISTA SIMPLES ── */
function ListaView({
  gastos, mes, onToggle, onEditar, onExcluir,
}: {
  gastos: LinhaFinanceira[];
  mes: string;
  onToggle: (id: string) => void;
  onEditar: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  onExcluir: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {gastos.map((l) => (
        <ItemGasto key={l.id} linha={l} mes={mes} onToggle={onToggle} onEditar={onEditar} onExcluir={onExcluir} />
      ))}
    </div>
  );
}

/* ── POR CATEGORIA ── */
function CategoriaView({
  gastos, mes, onToggle, onEditar, onExcluir,
}: {
  gastos: LinhaFinanceira[];
  mes: string;
  onToggle: (id: string) => void;
  onEditar: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  onExcluir: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
}) {
  const cats = Array.from(new Set(gastos.map((l) => l.categoria ?? "Outros")));

  return (
    <div className="flex flex-col gap-4">
      {cats.map((cat) => {
        const itens = gastos.filter((l) => (l.categoria ?? "Outros") === cat);
        const total = itens.reduce((acc, l) => acc + (l.valores[mes] ?? 0), 0);
        return (
          <CategoriaCard
            key={cat}
            categoria={cat}
            itens={itens}
            total={total}
            mes={mes}
            cor={getCor(cat)}
            onToggle={onToggle}
            onEditar={onEditar}
            onExcluir={onExcluir}
          />
        );
      })}
    </div>
  );
}

function CategoriaCard({
  categoria, itens, total, mes, cor, onToggle, onEditar, onExcluir,
}: {
  categoria: string;
  itens: LinhaFinanceira[];
  total: number;
  mes: string;
  cor: { bg: string; text: string };
  onToggle: (id: string) => void;
  onEditar: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  onExcluir: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
}) {
  const [aberto, setAberto] = useState(true);
  const pagos = itens.filter((l) => l.pagos[mes]).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cor.bg} ${cor.text}`}>
            {categoria}
          </span>
          <span className="text-sm font-semibold text-white">{formatBRL(total)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-xs">{pagos}/{itens.length} pagos</span>
          {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {aberto && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          {itens.map((l) => (
            <ItemGasto key={l.id} linha={l} mes={mes} onToggle={onToggle} onEditar={onEditar} onExcluir={onExcluir} showCategoria={false} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ITEM INDIVIDUAL ── */
function ItemGasto({
  linha, mes, onToggle, onEditar, onExcluir, showCategoria = true,
}: {
  linha: LinhaFinanceira;
  mes: string;
  onToggle: (id: string) => void;
  onEditar: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  onExcluir: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  showCategoria?: boolean;
}) {
  const valor = linha.valores[mes] ?? 0;
  const pago = !!linha.pagos[mes];
  const cor = getCor(linha.categoria);

  return (
    <div
      className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
        pago
          ? "bg-emerald-950/30 border-emerald-800/50"
          : "bg-gray-900 border-gray-800 hover:bg-gray-800/60"
      }`}
    >
      {/* Lado esquerdo: checkbox + nome + tag */}
      <button
        onClick={() => onToggle(linha.id)}
        className="flex items-center gap-3 flex-1 text-left min-w-0"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
            pago ? "bg-emerald-500 border-emerald-500" : "border-gray-600"
          }`}
        >
          {pago && <Check size={12} className="text-white" />}
        </div>
        <span className={`text-sm font-medium truncate ${pago ? "text-emerald-300" : "text-white"}`}>
          {linha.nome}
        </span>
        {showCategoria && linha.categoria && (
          <span className={`hidden sm:inline shrink-0 text-xs px-2 py-0.5 rounded-full ${cor.bg} ${cor.text}`}>
            {linha.categoria}
          </span>
        )}
      </button>

      {/* Lado direito: valor + botões de ação */}
      <div className="flex items-center gap-1 shrink-0 ml-4">
        <span className={`text-sm font-semibold mr-2 ${pago ? "text-emerald-400" : "text-white"}`}>
          {formatBRL(valor)}
        </span>
        <button
          onClick={(e) => onEditar(linha, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-gray-700"
          title="Editar despesa"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => onExcluir(linha, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700"
          title="Excluir despesa"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
