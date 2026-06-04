"use client";

import { useState } from "react";
import { LinhaFinanceira, MESES, MESES_KEYS, formatBRL } from "@/lib/financeiro-data";
import { Conta } from "@/lib/financeiro-types";
import { List, LayoutGrid, Check, ChevronDown, ChevronUp, Pencil, Trash2, X, CreditCard } from "lucide-react";
import ModalEditarDespesa from "./ModalEditarDespesa";
import ModalExcluirDespesa from "./ModalExcluirDespesa";

interface Props {
  linhas: LinhaFinanceira[];
  categorias: string[];
  contas: Conta[];
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

export default function GastosMes({ linhas, categorias, contas, onChange }: Props) {
  const [modo, setModo] = useState<"lista" | "categoria">("categoria");
  const [linhaSelecionada, setLinhaSelecionada] = useState<LinhaFinanceira | null>(null);
  const [linhaParaExcluir, setLinhaParaExcluir] = useState<LinhaFinanceira | null>(null);
  // ID da linha aguardando seleção de conta para pagar
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  const mesIdx = new Date().getMonth();
  const mes = MESES_KEYS[mesIdx];
  const mesLabel = MESES[mesIdx];

  const gastos = linhas.filter((l) => l.tipo === "gasto" && (l.valores[mes] ?? 0) > 0);

  function handleClickItem(linhaId: string) {
    const linha = linhas.find(l => l.id === linhaId);
    if (!linha) return;

    if (linha.pagos[mes]) {
      // Já está pago → desmarca
      onChange(linhas.map(l =>
        l.id === linhaId
          ? { ...l, pagos: { ...l.pagos, [mes]: false }, pagosContas: { ...l.pagosContas, [mes]: "" } }
          : l
      ));
      return;
    }

    // Não pago → se não há contas cadastradas, marca direto
    if (contas.length === 0) {
      onChange(linhas.map(l =>
        l.id === linhaId ? { ...l, pagos: { ...l.pagos, [mes]: true } } : l
      ));
      return;
    }

    // Se há só uma conta, marca direto nela
    if (contas.length === 1) {
      pagarComConta(linhaId, contas[0].id);
      return;
    }

    // Múltiplas contas → abre seletor
    setPagandoId(linhaId);
  }

  function pagarComConta(linhaId: string, contaId: string) {
    onChange(linhas.map(l =>
      l.id === linhaId
        ? { ...l, pagos: { ...l.pagos, [mes]: true }, pagosContas: { ...l.pagosContas, [mes]: contaId } }
        : l
    ));
    setPagandoId(null);
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
        <ListaView gastos={gastos} mes={mes} onToggle={handleClickItem} onEditar={handleEditar} onExcluir={handleExcluir} pagandoId={pagandoId} contas={contas} onPagarComConta={pagarComConta} onCancelarPagamento={() => setPagandoId(null)} />
      ) : (
        <CategoriaView gastos={gastos} mes={mes} onToggle={handleClickItem} onEditar={handleEditar} onExcluir={handleExcluir} pagandoId={pagandoId} contas={contas} onPagarComConta={pagarComConta} onCancelarPagamento={() => setPagandoId(null)} />
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

/* ── TIPOS COMPARTILHADOS ── */
interface ItemProps {
  gastos: LinhaFinanceira[];
  mes: string;
  onToggle: (id: string) => void;
  onEditar: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  onExcluir: (linha: LinhaFinanceira, e: React.MouseEvent) => void;
  pagandoId: string | null;
  contas: Conta[];
  onPagarComConta: (linhaId: string, contaId: string) => void;
  onCancelarPagamento: () => void;
}

/* ── LISTA SIMPLES ── */
function ListaView(props: ItemProps) {
  return (
    <div className="flex flex-col gap-2">
      {props.gastos.map((l) => (
        <ItemGasto key={l.id} linha={l} {...props} />
      ))}
    </div>
  );
}

/* ── POR CATEGORIA ── */
function CategoriaView(props: ItemProps) {
  const cats = Array.from(new Set(props.gastos.map((l) => l.categoria ?? "Outros")));
  return (
    <div className="flex flex-col gap-4">
      {cats.map((cat) => {
        const itens = props.gastos.filter((l) => (l.categoria ?? "Outros") === cat);
        const total = itens.reduce((acc, l) => acc + (l.valores[props.mes] ?? 0), 0);
        return (
          <CategoriaCard key={cat} categoria={cat} itens={itens} total={total} cor={getCor(cat)} {...props} />
        );
      })}
    </div>
  );
}

function CategoriaCard({ categoria, itens, total, cor, ...props }: ItemProps & {
  categoria: string;
  itens: LinhaFinanceira[];
  total: number;
  cor: { bg: string; text: string };
}) {
  const [aberto, setAberto] = useState(true);
  const pagos = itens.filter((l) => l.pagos[props.mes]).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cor.bg} ${cor.text}`}>{categoria}</span>
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
            <ItemGasto key={l.id} linha={l} {...props} showCategoria={false} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ITEM INDIVIDUAL ── */
function ItemGasto({
  linha, mes, onToggle, onEditar, onExcluir,
  pagandoId, contas, onPagarComConta, onCancelarPagamento,
  showCategoria = true,
}: ItemProps & { linha: LinhaFinanceira; showCategoria?: boolean }) {
  const valor = linha.valores[mes] ?? 0;
  const pago = !!linha.pagos[mes];
  const cor = getCor(linha.categoria);
  const contaPagou = contas.find(c => c.id === linha.pagosContas?.[mes]);
  const selecionandoConta = pagandoId === linha.id;

  return (
    <div className={`group w-full flex flex-col rounded-xl border transition-all ${
      pago ? "bg-emerald-950/30 border-emerald-800/50" : selecionandoConta ? "bg-indigo-950/30 border-indigo-700" : "bg-gray-900 border-gray-800 hover:bg-gray-800/60"
    }`}>
      {/* Linha principal */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onToggle(linha.id)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
            pago ? "bg-emerald-500 border-emerald-500" : selecionandoConta ? "border-indigo-400" : "border-gray-600"
          }`}>
            {pago && <Check size={12} className="text-white" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium truncate ${pago ? "text-emerald-300" : "text-white"}`}>
                {linha.nome}
              </span>
              {linha.cartaoVinculadoId && (
                <span className="flex items-center gap-1 text-xs text-purple-400 shrink-0">
                  <CreditCard size={10} /> auto
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {linha.diaVencimento && (
                <span className={`text-xs ${
                  pago
                    ? "text-emerald-700"
                    : (() => {
                        const hoje = new Date().getDate();
                        if (linha.diaVencimento < hoje) return "text-red-400";
                        if (linha.diaVencimento <= hoje + 3) return "text-orange-400";
                        return "text-gray-500";
                      })()
                }`}>
                  vence dia {linha.diaVencimento}
                </span>
              )}
              {pago && contaPagou && (
                <span className="text-xs text-emerald-600">{contaPagou.nome}</span>
              )}
            </div>
          </div>
          {showCategoria && linha.categoria && (
            <span className={`hidden sm:inline shrink-0 text-xs px-2 py-0.5 rounded-full ${cor.bg} ${cor.text}`}>
              {linha.categoria}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          <span className={`text-sm font-semibold mr-2 ${pago ? "text-emerald-400" : "text-white"}`}>
            {formatBRL(valor)}
          </span>
          <button onClick={(e) => onEditar(linha, e)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-gray-700">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => onExcluir(linha, e)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Seletor de conta inline */}
      {selecionandoConta && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-indigo-300 shrink-0">Pagar de:</span>
          {contas.map(c => (
            <button
              key={c.id}
              onClick={() => onPagarComConta(linha.id, c.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {c.nome}
            </button>
          ))}
          <button onClick={onCancelarPagamento} className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
