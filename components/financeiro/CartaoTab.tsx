"use client";

import { useState } from "react";
import {
  Cartao, Parcelamento, GastoVariavel,
  faturaCartaoMes, parcelasDoMes,
} from "@/lib/financeiro-types";
import { MESES, MESES_KEYS, formatBRL } from "@/lib/financeiro-data";
import ModalParcelamento from "./ModalParcelamento";
import { Plus, Trash2, ChevronDown, ChevronUp, CreditCard, Settings } from "lucide-react";
import Link from "next/link";

interface Props {
  cartoes: Cartao[];
  parcelamentos: Parcelamento[];
  gastosVariaveis: GastoVariavel[];
  onAddParcelamento: (p: Parcelamento) => void;
  onRemoveParcelamento: (id: string) => void;
}

export default function CartaoTab({ cartoes, parcelamentos, gastosVariaveis, onAddParcelamento, onRemoveParcelamento }: Props) {
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(cartoes.slice(0, 1).map((c) => c.id))
  );
  const [modalCartaoId, setModalCartaoId] = useState<string | null>(null);

  function toggleAberto(id: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (cartoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <CreditCard size={28} className="text-gray-600" />
        </div>
        <h3 className="text-white font-semibold mb-2">Nenhum cartão cadastrado</h3>
        <p className="text-gray-500 text-sm mb-5 max-w-xs">
          Cadastre seus cartões de crédito nas configurações para gerenciar faturas e parcelamentos.
        </p>
        <Link
          href="/configuracoes"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Settings size={16} /> Ir para Configurações
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Cartões de Crédito</h3>
          <p className="text-gray-400 text-sm mt-0.5">Parcelamentos e faturas projetadas</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {cartoes.map((cartao) => (
          <CartaoSection
            key={cartao.id}
            cartao={cartao}
            aberto={abertos.has(cartao.id)}
            onToggle={() => toggleAberto(cartao.id)}
            parcelamentos={parcelamentos}
            gastosVariaveis={gastosVariaveis}
            onAbrirModal={() => setModalCartaoId(cartao.id)}
            onRemoveParcelamento={onRemoveParcelamento}
          />
        ))}
      </div>

      {modalCartaoId && (
        <ModalParcelamento
          cartoes={cartoes}
          cartaoPreSelecionado={modalCartaoId}
          onSalvar={(p) => { onAddParcelamento(p); setModalCartaoId(null); }}
          onFechar={() => setModalCartaoId(null)}
        />
      )}
    </div>
  );
}

// ── SEÇÃO RETRÁTIL DE UM CARTÃO ────────────────────────────

function CartaoSection({
  cartao, aberto, onToggle, parcelamentos, gastosVariaveis, onAbrirModal, onRemoveParcelamento,
}: {
  cartao: Cartao;
  aberto: boolean;
  onToggle: () => void;
  parcelamentos: Parcelamento[];
  gastosVariaveis: GastoVariavel[];
  onAbrirModal: () => void;
  onRemoveParcelamento: (id: string) => void;
}) {
  const mesAtualIdx = new Date().getMonth();
  const faturaAtual = faturaCartaoMes(parcelamentos, gastosVariaveis, cartao.id, mesAtualIdx);
  const perc = cartao.limite > 0 ? (faturaAtual / cartao.limite) * 100 : 0;

  const parcelasAtivas = parcelamentos.filter((p) => {
    const fimIdx = p.mesInicio + p.totalParcelas - 1;
    return p.cartaoId === cartao.id && fimIdx >= mesAtualIdx;
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header retrátil */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors text-left"
      >
        {/* Indicador de cor do cartão */}
        <div className={`w-3 h-3 rounded-full shrink-0 ${cartao.cor}`} />

        {/* Nome e infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-sm font-semibold text-white">{cartao.nome}</span>
            <span className="text-xs text-gray-500">
              Fecha dia {cartao.diaFechamento} · Vence dia {cartao.diaVencimento}
            </span>
          </div>
          {/* Barra de limite */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  perc > 80 ? "bg-red-500" : perc > 50 ? "bg-yellow-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(perc, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {formatBRL(faturaAtual)} de {formatBRL(cartao.limite)}
            </span>
          </div>
        </div>

        {/* Fatura + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-base font-bold text-white">{formatBRL(faturaAtual)}</p>
            <p className="text-xs text-gray-500">{MESES[mesAtualIdx]}</p>
          </div>
          {aberto ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </div>
      </button>

      {/* Conteúdo expandido */}
      {aberto && (
        <div className="border-t border-gray-800 p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Fatura do mês atual */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">
                Fatura de {MESES[mesAtualIdx]}
              </h4>
              <div className="flex flex-col divide-y divide-gray-800 rounded-xl border border-gray-800 overflow-hidden">
                {parcelasDoMes(parcelamentos, cartao.id, mesAtualIdx).map((p) => {
                  const numParcela = mesAtualIdx - p.mesInicio + 1;
                  return (
                    <div key={p.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-800/30">
                      <div>
                        <p className="text-sm text-white">{p.descricao}</p>
                        <p className="text-xs text-gray-500">{numParcela}/{p.totalParcelas}x · {p.categoria}</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatBRL(p.valorParcela)}</span>
                    </div>
                  );
                })}
                {gastosVariaveis
                  .filter((g) => g.cartaoId === cartao.id && new Date(g.data).getMonth() === mesAtualIdx)
                  .map((g) => (
                    <div key={g.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-800/30">
                      <div>
                        <p className="text-sm text-white">{g.descricao}</p>
                        <p className="text-xs text-gray-500">{g.categoria} · {new Date(g.data).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatBRL(g.valor)}</span>
                    </div>
                  ))}
                {parcelasDoMes(parcelamentos, cartao.id, mesAtualIdx).length === 0 &&
                  gastosVariaveis.filter((g) => g.cartaoId === cartao.id && new Date(g.data).getMonth() === mesAtualIdx).length === 0 && (
                  <p className="text-sm text-gray-600 px-3 py-4 text-center">Nenhum lançamento neste mês</p>
                )}
                <div className="flex justify-between items-center px-3 py-2.5 bg-gray-800/60">
                  <span className="text-sm font-semibold text-gray-300">Total estimado</span>
                  <span className="text-sm font-bold text-white">{formatBRL(faturaAtual)}</span>
                </div>
              </div>
            </div>

            {/* Projeção */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Próximas faturas</h4>
              <div className="flex flex-col gap-1.5">
                {MESES_KEYS.slice(mesAtualIdx, mesAtualIdx + 6).map((_, offset) => {
                  const idx = mesAtualIdx + offset;
                  if (idx > 11) return null;
                  const fatura = faturaCartaoMes(parcelamentos, gastosVariaveis, cartao.id, idx);
                  const p = cartao.limite > 0 ? (fatura / cartao.limite) * 100 : 0;
                  return (
                    <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${offset === 0 ? "bg-indigo-950/30 border border-indigo-800/40" : "bg-gray-800/20"}`}>
                      <span className="text-xs text-gray-500 w-14 shrink-0">{MESES[idx]}</span>
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p > 80 ? "bg-red-500" : p > 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(p, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold w-24 text-right ${offset === 0 ? "text-indigo-300" : "text-white"}`}>
                        {formatBRL(fatura)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Parcelamentos ativos + botão adicionar */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">
              Parcelamentos ativos
              <span className="text-gray-500 font-normal ml-1.5">({parcelasAtivas.length})</span>
            </h4>
            <button
              onClick={onAbrirModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} /> Novo parcelamento
            </button>
          </div>

          {parcelasAtivas.length === 0 ? (
            <p className="text-sm text-gray-600 py-3 text-center">Nenhum parcelamento ativo</p>
          ) : (
            <div className="flex flex-col gap-2">
              {parcelasAtivas.map((p) => {
                const parcelaAtualNum = mesAtualIdx - p.mesInicio + 1;
                const restantes = p.totalParcelas - parcelaAtualNum + 1;
                const percPago = ((parcelaAtualNum - 1) / p.totalParcelas) * 100;
                return (
                  <div key={p.id} className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">{p.descricao}</span>
                        <span className="text-xs text-gray-500 shrink-0">{p.categoria}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percPago}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{parcelaAtualNum}/{p.totalParcelas}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">{formatBRL(p.valorParcela)}/mês</p>
                      <p className="text-xs text-gray-500">{restantes}x restantes</p>
                    </div>
                    <button
                      onClick={() => onRemoveParcelamento(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
