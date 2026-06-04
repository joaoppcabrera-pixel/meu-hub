"use client";

import { useState } from "react";
import { Entrada, CATEGORIAS_ENTRADA } from "@/lib/financeiro-types";
import { Conta } from "@/lib/financeiro-types";
import { MESES, MESES_KEYS, formatBRL, mesDate } from "@/lib/financeiro-data";
import { Plus, Trash2, TrendingUp, X } from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface Props {
  entradas: Entrada[];
  contas: Conta[];
  onAdd: (e: Entrada) => void;
  onRemove: (id: string) => void;
}

const CAT_CORES: Record<string, string> = {
  "Salário":          "text-emerald-400",
  "Freelance":        "text-blue-400",
  "Renda Extra":      "text-indigo-400",
  "Dividendos":       "text-purple-400",
  "Aluguel Recebido": "text-yellow-400",
  "Restituição":      "text-teal-400",
  "Bônus":            "text-orange-400",
  "Outros":           "text-gray-400",
};

export default function EntradasTab({ entradas, contas, onAdd, onRemove }: Props) {
  const mesAtualIdx = new Date().getMonth();
  const [mesIdx, setMesIdx] = useState(mesAtualIdx);
  const [modalAberto, setModalAberto] = useState(false);

  const entradasMes = entradas
    .filter((e) => mesDate(e.data) === mesIdx)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalMes = entradasMes.reduce((acc, e) => acc + e.valor, 0);

  // Por categoria
  const porCategoria = entradasMes.reduce<Record<string, number>>((acc, e) => {
    acc[e.categoria] = (acc[e.categoria] ?? 0) + e.valor;
    return acc;
  }, {});
  const topCats = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  // Por data
  const porData = entradasMes.reduce<Record<string, Entrada[]>>((acc, e) => {
    if (!acc[e.data]) acc[e.data] = [];
    acc[e.data].push(e);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Entradas</h3>
          <p className="text-gray-400 text-sm mt-0.5">Salário, renda extra e outros recebimentos</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Registrar entrada
        </button>
      </div>

      {/* Seletor de mês */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5">
        {MESES.map((m, i) => (
          <button
            key={m}
            onClick={() => setMesIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              mesIdx === i ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="col-span-2 sm:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total recebido</p>
          <p className="text-xl font-bold text-emerald-400">{formatBRL(totalMes)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{entradasMes.length} lançamentos</p>
        </div>
        {topCats.map(([cat, val]) => (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className={`text-xs font-medium mb-1 ${CAT_CORES[cat] ?? "text-gray-400"}`}>{cat}</p>
            <p className="text-base font-bold text-white">{formatBRL(val)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalMes > 0 ? ((val / totalMes) * 100).toFixed(0) : 0}% do total
            </p>
          </div>
        ))}
      </div>

      {/* Lista agrupada por data */}
      {Object.keys(porData).length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <TrendingUp size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma entrada registrada em {MESES[mesIdx]}</p>
          <button
            onClick={() => setModalAberto(true)}
            className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
          >
            + Registrar primeira entrada
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(porData).map(([data, itens]) => {
            const totalDia = itens.reduce((acc, e) => acc + e.valor, 0);
            const d = new Date(data + "T12:00:00");
            const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={data} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2.5 bg-gray-800/50">
                  <span className="text-xs font-medium text-gray-300 capitalize">{label}</span>
                  <span className="text-xs font-semibold text-emerald-400">+{formatBRL(totalDia)}</span>
                </div>
                {itens.map((e) => {
                  const conta = contas.find((c) => c.id === e.contaId);
                  return (
                    <div key={e.id} className="group flex items-center justify-between px-4 py-3 border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{e.descricao}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${CAT_CORES[e.categoria] ?? "text-gray-500"}`}>{e.categoria}</span>
                          {conta && (
                            <span className="text-xs text-gray-600">· {conta.nome}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-sm font-semibold text-emerald-400">+{formatBRL(e.valor)}</span>
                        <button
                          onClick={() => onRemove(e.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 p-1.5 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <ModalEntrada
          contas={contas}
          onSalvar={(e) => { onAdd(e); setModalAberto(false); }}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}

// ── MODAL ──────────────────────────────────────────────────

function ModalEntrada({ contas, onSalvar, onFechar }: {
  contas: Conta[];
  onSalvar: (e: Entrada) => void;
  onFechar: () => void;
}) {
  const hoje = new Date().toISOString().split("T")[0];
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(hoje);
  const [categoria, setCategoria] = useState(CATEGORIAS_ENTRADA[0]);
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");

  const podeSalvar = descricao.trim() && valor > 0 && contaId;

  function handleSalvar() {
    if (!podeSalvar) return;
    onSalvar({
      id: `ent-${Date.now()}`,
      descricao: descricao.trim(),
      valor,
      data,
      categoria,
      contaId,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Registrar entrada</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Descrição */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Descrição</label>
            <input
              autoFocus
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && podeSalvar && handleSalvar()}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-gray-600"
              placeholder="Ex: Salário maio, Freela XYZ..."
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Valor</label>
              <CurrencyInput
                  value={valor}
                  onChange={setValor}
                  className="focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS_ENTRADA.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-colors ${
                    categoria === c ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Conta de destino */}
          {contas.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Recebido em</label>
              <div className="flex flex-col gap-2">
                {contas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContaId(c.id)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      contaId === c.id
                        ? "border-emerald-500 bg-emerald-950/30 text-white"
                        : "border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    <span>{c.nome}</span>
                    {contaId === c.id && <span className="text-xs text-emerald-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {contas.length === 0 && (
            <p className="text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-800/40 rounded-xl px-3 py-2">
              Cadastre uma conta bancária em Configurações para registrar entradas.
            </p>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">Cancelar</button>
          <button
            onClick={handleSalvar}
            disabled={!podeSalvar}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}
