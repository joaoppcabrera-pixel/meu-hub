"use client";

import { useState } from "react";
import { GastoVariavel, Cartao, Conta, MEIOS_PAGAMENTO } from "@/lib/financeiro-types";
import { MESES, MESES_KEYS, formatBRL, mesDate } from "@/lib/financeiro-data";
import ModalGastoVariavel from "./ModalGastoVariavel";
import { Plus, Trash2, Search } from "lucide-react";

interface Props {
  gastos: GastoVariavel[];
  cartoes: Cartao[];
  contas: Conta[];
  onAdd: (g: GastoVariavel) => void;
  onRemove: (id: string) => void;
}

const CATEGORIA_CORES: Record<string, string> = {
  Moradia: "text-blue-400", Impostos: "text-red-400", Saúde: "text-emerald-400",
  Serviços: "text-yellow-400", Cartões: "text-purple-400", Dívidas: "text-orange-400",
  Investimentos: "text-indigo-400", Outros: "text-gray-400",
};

const MEIO_CORES: Record<string, string> = {
  debito: "bg-blue-500/15 text-blue-400",
  credito: "bg-purple-500/15 text-purple-400",
  pix: "bg-emerald-500/15 text-emerald-400",
  dinheiro: "bg-yellow-500/15 text-yellow-400",
  va: "bg-orange-500/15 text-orange-400",
};

export default function GastosVariaveisTab({ gastos, cartoes, contas, onAdd, onRemove }: Props) {
  const mesAtualIdx = new Date().getMonth();
  const [mesIdx, setMesIdx] = useState(mesAtualIdx);
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const mesKey = MESES_KEYS[mesIdx];

  const gastosFiltrados = gastos
    .filter((g) => {
      const gMes = mesDate(g.data);
      return gMes === mesIdx && g.descricao.toLowerCase().includes(busca.toLowerCase());
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalMes = gastosFiltrados.reduce((acc, g) => acc + g.valor, 0);

  // Agrupado por categoria
  const porCategoria = gastosFiltrados.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.valor;
    return acc;
  }, {});
  const topCategorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Agrupado por data
  const porData = gastosFiltrados.reduce<Record<string, GastoVariavel[]>>((acc, g) => {
    const d = g.data;
    if (!acc[d]) acc[d] = [];
    acc[d].push(g);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Gastos Variáveis</h3>
          <p className="text-gray-400 text-sm mt-0.5">Registro de gastos do dia a dia</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Registrar gasto
        </button>
      </div>

      {/* Seletor de mês */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5">
        {MESES.map((m, i) => (
          <button
            key={m}
            onClick={() => setMesIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              mesIdx === i ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="col-span-2 sm:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total do mês</p>
          <p className="text-xl font-bold text-white">{formatBRL(totalMes)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{gastosFiltrados.length} lançamentos</p>
        </div>
        {topCategorias.map(([cat, val]) => (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className={`text-xs font-medium mb-1 ${CATEGORIA_CORES[cat] ?? "text-gray-400"}`}>{cat}</p>
            <p className="text-base font-bold text-white">{formatBRL(val)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{totalMes > 0 ? ((val / totalMes) * 100).toFixed(0) : 0}% do total</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar gasto..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Lista agrupada por data */}
      {Object.keys(porData).length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm">Nenhum gasto registrado em {MESES[mesIdx]}</p>
          <button
            onClick={() => setModalAberto(true)}
            className="mt-3 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
          >
            + Registrar primeiro gasto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(porData).map(([data, itens]) => {
            const totalDia = itens.reduce((acc, g) => acc + g.valor, 0);
            const d = new Date(data + "T12:00:00");
            const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={data} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2.5 bg-gray-800/50">
                  <span className="text-xs font-medium text-gray-300 capitalize">{label}</span>
                  <span className="text-xs font-semibold text-white">{formatBRL(totalDia)}</span>
                </div>
                <div className="flex flex-col">
                  {itens.map((g) => {
                    const cartao = cartoes.find((c) => c.id === g.cartaoId);
                    const conta = contas.find((c) => c.id === g.contaId);
                    return (
                      <div key={g.id} className="group flex items-center justify-between px-4 py-3 border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div>
                            <p className="text-sm text-white truncate">{g.descricao}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${CATEGORIA_CORES[g.categoria] ?? "text-gray-500"}`}>{g.categoria}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-md ${MEIO_CORES[g.meio] ?? "bg-gray-700 text-gray-400"}`}>
                                {MEIOS_PAGAMENTO[g.meio]}
                                {cartao ? ` · ${cartao.nome}` : ""}
                                {conta && (g.meio === "debito" || g.meio === "pix") ? ` · ${conta.nome}` : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <span className="text-sm font-semibold text-white">{formatBRL(g.valor)}</span>
                          <button
                            onClick={() => onRemove(g.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 p-1.5 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <ModalGastoVariavel
          cartoes={cartoes}
          contas={contas}
          onSalvar={(g) => { onAdd(g); setModalAberto(false); }}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
