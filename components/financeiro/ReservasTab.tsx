"use client";

import { useState } from "react";
import { Reserva, TipoReserva, TIPOS_RESERVA, Conta } from "@/lib/financeiro-types";
import { MESES, MESES_KEYS, formatBRL } from "@/lib/financeiro-data";
import { Plus, Trash2, Target, TrendingUp, X } from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface Props {
  reservas: Reserva[];
  contas: Conta[];
  onAdd: (r: Reserva) => void;
  onUpdate: (r: Reserva) => void;
  onRemove: (id: string) => void;
}

const TIPO_CORES: Record<TipoReserva, { bg: string; text: string }> = {
  emergencia: { bg: "bg-red-500/15",    text: "text-red-400" },
  cdb:        { bg: "bg-blue-500/15",   text: "text-blue-400" },
  tesouro:    { bg: "bg-emerald-500/15",text: "text-emerald-400" },
  acoes:      { bg: "bg-purple-500/15", text: "text-purple-400" },
  fii:        { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  poupanca:   { bg: "bg-gray-500/15",   text: "text-gray-400" },
  outros:     { bg: "bg-indigo-500/15", text: "text-indigo-400" },
};

export default function ReservasTab({ reservas, contas, onAdd, onUpdate, onRemove }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [aportandoId, setAportandoId] = useState<string | null>(null);
  const [valorAporte, setValorAporte] = useState(0);
  const [contaAporte, setContaAporte] = useState(contas[0]?.id ?? "");

  const mesAtual = MESES_KEYS[new Date().getMonth()];
  const totalReservado = reservas.reduce((acc, r) => acc + r.saldoAtual, 0);
  const totalMeta = reservas.filter((r) => r.meta).reduce((acc, r) => acc + (r.meta ?? 0), 0);

  function handleAporte(reserva: Reserva) {
    const valor = valorAporte;
    if (!valor) return;
    onUpdate({
      ...reserva,
      saldoAtual: reserva.saldoAtual + valor,
      aportes: { ...reserva.aportes, [mesAtual]: (reserva.aportes[mesAtual] ?? 0) + valor },
      aportesContas: { ...reserva.aportesContas, [mesAtual]: contaAporte },
    });
    setAportandoId(null);
    setValorAporte(0);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Reservas e Investimentos</h3>
          <p className="text-gray-400 text-sm mt-0.5">Onde seu dinheiro está guardado</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nova reserva
        </button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total reservado</p>
          <p className="text-2xl font-bold text-emerald-400">{formatBRL(totalReservado)}</p>
        </div>
        {totalMeta > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">Progresso geral</p>
            <p className="text-2xl font-bold text-indigo-400">
              {((totalReservado / totalMeta) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">da meta de {formatBRL(totalMeta)}</p>
          </div>
        )}
      </div>

      {/* Lista de reservas */}
      {reservas.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm">Nenhuma reserva cadastrada</p>
          <button onClick={() => setModalAberto(true)} className="mt-3 text-indigo-400 text-sm hover:text-indigo-300">
            + Adicionar primeira reserva
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservas.map((r) => {
            const cor = TIPO_CORES[r.tipo];
            const perc = r.meta ? Math.min((r.saldoAtual / r.meta) * 100, 100) : null;
            const aporteMes = r.aportes[mesAtual] ?? 0;
            const isAportando = aportandoId === r.id;

            return (
              <div key={r.id} className="group bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cor.bg} ${cor.text}`}>
                      {TIPOS_RESERVA[r.tipo]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.nome}</p>
                      {aporteMes > 0 && (() => {
                        const contaNome = contas.find(c => c.id === r.aportesContas?.[mesAtual])?.nome;
                        return (
                          <p className="text-xs text-emerald-400 mt-0.5">
                            +{formatBRL(aporteMes)} em {MESES[new Date().getMonth()]}
                            {contaNome && <span className="text-emerald-600"> · {contaNome}</span>}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatBRL(r.saldoAtual)}</p>
                      {r.meta && <p className="text-xs text-gray-500">meta: {formatBRL(r.meta)}</p>}
                    </div>
                    <button
                      onClick={() => onRemove(r.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 p-1.5 rounded-lg ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {perc !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{perc.toFixed(0)}% da meta</span>
                      <span>{formatBRL(r.meta! - r.saldoAtual)} restante</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${perc >= 100 ? "bg-emerald-500" : cor.text.replace("text-", "bg-")}`}
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Aporte rápido */}
                {isAportando ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {/* Valor */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CurrencyInput
                          autoFocus
                          value={valorAporte}
                          onChange={setValorAporte}
                          onKeyDown={(e) => e.key === "Enter" && handleAporte(r)}
                          className="border-indigo-500 py-2"
                        />
                      </div>
                      <button onClick={() => handleAporte(r)} disabled={!valorAporte || !contaAporte} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm rounded-xl font-medium transition-colors">
                        Confirmar
                      </button>
                      <button onClick={() => { setAportandoId(null); setValorAporte(0); }} className="px-3 py-2 bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-xl transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    {/* Conta de origem */}
                    {contas.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 self-center">Saiu de:</span>
                        {contas.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setContaAporte(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              contaAporte === c.id
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                            }`}
                          >
                            {c.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setAportandoId(r.id); setValorAporte(0); }}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                  >
                    <TrendingUp size={13} /> Registrar aporte
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <ModalNovaReserva
          onSalvar={(r) => { onAdd(r); setModalAberto(false); }}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}

function ModalNovaReserva({ onSalvar, onFechar }: { onSalvar: (r: Reserva) => void; onFechar: () => void }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoReserva>("cdb");
  const [saldo, setSaldo] = useState(0);
  const [meta, setMeta] = useState(0);

  const podeSalvar = nome.trim() && saldo >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Nova reserva</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Nome</label>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              placeholder="Ex: CDB Nubank, Tesouro Selic..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TIPOS_RESERVA) as TipoReserva[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    tipo === t ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {TIPOS_RESERVA[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Saldo atual</label>
              <CurrencyInput value={saldo} onChange={setSaldo} />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Meta (opcional)</label>
              <CurrencyInput value={meta} onChange={setMeta} placeholder="0,00 (opcional)" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">Cancelar</button>
          <button
            onClick={() => onSalvar({ id: `res-${Date.now()}`, nome: nome.trim(), tipo, saldoAtual: saldo, meta: meta > 0 ? meta : undefined, aportes: {}, aportesContas: {} })}
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
