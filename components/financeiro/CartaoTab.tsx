"use client";

import { useState } from "react";
import {
  Cartao, Parcelamento, GastoVariavel, Assinatura,
  faturaCartaoMes, parcelasDoMes, totalAssinaturasCartaoMes,
  statusFatura, mesInvoiceAtual, mesInvoiceGasto,
} from "@/lib/financeiro-types";
import { MESES, MESES_KEYS, formatBRL, mesDate } from "@/lib/financeiro-data";
import ModalParcelamento from "./ModalParcelamento";
import ModalAssinatura from "./ModalAssinatura";
import { Plus, Trash2, ChevronDown, ChevronUp, CreditCard, Settings, RefreshCw, XCircle, Pencil } from "lucide-react";
import Link from "next/link";

interface Props {
  cartoes: Cartao[];
  parcelamentos: Parcelamento[];
  gastosVariaveis: GastoVariavel[];
  assinaturas: Assinatura[];
  onAddParcelamento: (p: Parcelamento) => void;
  onUpdateParcelamento: (p: Parcelamento) => void;
  onRemoveParcelamento: (id: string) => void;
  onAddAssinatura: (a: Assinatura) => void;
  onUpdateAssinatura: (a: Assinatura) => void;
  onCancelarAssinatura: (id: string) => void;
  onRemoveAssinatura: (id: string) => void;
}

type ModalTipo = "parcelamento" | "assinatura" | null;

export default function CartaoTab({
  cartoes, parcelamentos, gastosVariaveis, assinaturas,
  onAddParcelamento, onUpdateParcelamento, onRemoveParcelamento,
  onAddAssinatura, onUpdateAssinatura, onCancelarAssinatura, onRemoveAssinatura,
}: Props) {
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(cartoes.slice(0, 1).map((c) => c.id))
  );
  const [modalCartaoId, setModalCartaoId] = useState<string | null>(null);
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);
  const [parcelamentoEditar, setParcelamentoEditar] = useState<Parcelamento | undefined>();
  const [assinaturaEditar, setAssinaturaEditar] = useState<Assinatura | undefined>();

  function toggleAberto(id: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function abrirModal(cartaoId: string, tipo: ModalTipo, item?: Parcelamento | Assinatura) {
    setModalCartaoId(cartaoId);
    setModalTipo(tipo);
    if (tipo === "parcelamento") setParcelamentoEditar(item as Parcelamento | undefined);
    if (tipo === "assinatura") setAssinaturaEditar(item as Assinatura | undefined);
  }

  function fecharModal() {
    setModalCartaoId(null);
    setModalTipo(null);
    setParcelamentoEditar(undefined);
    setAssinaturaEditar(undefined);
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
        <Link href="/configuracoes" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
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
          <p className="text-gray-400 text-sm mt-0.5">Parcelamentos, assinaturas e faturas</p>
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
            assinaturas={assinaturas}
            onAbrirModal={(tipo, item) => abrirModal(cartao.id, tipo, item)}
            onRemoveParcelamento={onRemoveParcelamento}
            onCancelarAssinatura={onCancelarAssinatura}
            onRemoveAssinatura={onRemoveAssinatura}
          />
        ))}
      </div>

      {modalCartaoId && modalTipo === "parcelamento" && (
        <ModalParcelamento
          cartoes={cartoes}
          cartaoPreSelecionado={modalCartaoId}
          parcelamentoEditar={parcelamentoEditar}
          onSalvar={(p) => {
            parcelamentoEditar ? onUpdateParcelamento(p) : onAddParcelamento(p);
            fecharModal();
          }}
          onFechar={fecharModal}
        />
      )}
      {modalCartaoId && modalTipo === "assinatura" && (
        <ModalAssinatura
          cartoes={cartoes}
          cartaoPreSelecionado={modalCartaoId}
          assinaturaEditar={assinaturaEditar}
          onSalvar={(a) => {
            assinaturaEditar ? onUpdateAssinatura(a) : onAddAssinatura(a);
            fecharModal();
          }}
          onFechar={fecharModal}
        />
      )}
    </div>
  );
}

// ── SEÇÃO RETRÁTIL ─────────────────────────────────────────

function CartaoSection({
  cartao, aberto, onToggle, parcelamentos, gastosVariaveis, assinaturas,
  onAbrirModal, onRemoveParcelamento, onCancelarAssinatura, onRemoveAssinatura,
}: {
  cartao: Cartao;
  aberto: boolean;
  onToggle: () => void;
  parcelamentos: Parcelamento[];
  gastosVariaveis: GastoVariavel[];
  assinaturas: Assinatura[];
  onAbrirModal: (tipo: "parcelamento" | "assinatura", item?: Parcelamento | Assinatura) => void;
  onRemoveParcelamento: (id: string) => void;
  onCancelarAssinatura: (id: string) => void;
  onRemoveAssinatura: (id: string) => void;
}) {
  const mesAtualIdx = new Date().getMonth();
  const status = statusFatura(cartao);
  const invoiceMes = mesInvoiceAtual(cartao);

  const faturaAtual = faturaCartaoMes(parcelamentos, gastosVariaveis, cartao.id, invoiceMes, cartao.diaFechamento, assinaturas);
  const perc = cartao.limite > 0 ? (faturaAtual / cartao.limite) * 100 : 0;

  const parcelasAtivas = parcelamentos.filter((p) => {
    const fimIdx = p.mesInicio + p.totalParcelas - 1;
    return p.cartaoId === cartao.id && fimIdx >= mesAtualIdx;
  });

  const assinaturasDoCartao = assinaturas.filter((a) => a.cartaoId === cartao.id);
  const assinaturasAtivas = assinaturasDoCartao.filter((a) => a.ativa);

  // Lançamentos da fatura atual (invoice)
  const parcelasInvoice = parcelasDoMes(parcelamentos, cartao.id, invoiceMes);
  const gastosInvoice = gastosVariaveis.filter(
    (g) => g.cartaoId === cartao.id && mesInvoiceGasto(g.data, cartao.diaFechamento) === invoiceMes
  );
  const assinaturasInvoice = assinaturasDoCartao.filter(
    (a) => a.ativa && a.mesInicio <= invoiceMes && (a.mesFim === undefined || a.mesFim >= invoiceMes)
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors text-left">
        <div className={`w-3 h-3 rounded-full shrink-0 ${cartao.cor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white">{cartao.nome}</span>
            {/* Status da fatura */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              status === "aberta"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-yellow-500/15 text-yellow-400"
            }`}>
              Fatura {status}
            </span>
            <span className="text-xs text-gray-500">
              {status === "aberta"
                ? `Fecha dia ${cartao.diaFechamento} · Vence dia ${cartao.diaVencimento}`
                : `Fechou dia ${cartao.diaFechamento} · Acumulando para ${MESES[invoiceMes]}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${perc > 80 ? "bg-red-500" : perc > 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(perc, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {formatBRL(faturaAtual)} de {formatBRL(cartao.limite)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-base font-bold text-white">{formatBRL(faturaAtual)}</p>
            <p className="text-xs text-gray-500">{MESES[invoiceMes]}</p>
          </div>
          {aberto ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </div>
      </button>

      {/* Conteúdo expandido */}
      {aberto && (
        <div className="border-t border-gray-800 p-5 flex flex-col gap-6">
          {/* Fatura atual + projeção */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Detalhes da fatura */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">
                Fatura de {MESES[invoiceMes]}
                <span className={`ml-2 text-xs font-normal ${status === "aberta" ? "text-emerald-400" : "text-yellow-400"}`}>
                  ({status})
                </span>
              </h4>
              <ListaFatura
                parcelasInvoice={parcelasInvoice}
                assinaturasInvoice={assinaturasInvoice}
                gastosInvoice={gastosInvoice}
                invoiceMes={invoiceMes}
                faturaAtual={faturaAtual}
              />
            </div>

            {/* Projeção */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Próximas faturas</h4>
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: 6 }, (_, offset) => {
                  const idx = (invoiceMes + offset) % 12;
                  const fatura = faturaCartaoMes(parcelamentos, gastosVariaveis, cartao.id, idx, cartao.diaFechamento, assinaturas);
                  const p = cartao.limite > 0 ? (fatura / cartao.limite) * 100 : 0;
                  return (
                    <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${offset === 0 ? "bg-indigo-950/30 border border-indigo-800/40" : "bg-gray-800/20"}`}>
                      <span className="text-xs text-gray-500 w-14 shrink-0">{MESES[idx]}</span>
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p > 80 ? "bg-red-500" : p > 50 ? "bg-yellow-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(p, 100)}%` }} />
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

          {/* Parcelamentos ativos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">
                Parcelamentos <span className="text-gray-500 font-normal">({parcelasAtivas.length})</span>
              </h4>
              <button onClick={() => onAbrirModal("parcelamento")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                <Plus size={14} /> Novo parcelamento
              </button>
            </div>
            {parcelasAtivas.length === 0 ? (
              <p className="text-sm text-gray-600 py-2 text-center">Nenhum parcelamento ativo</p>
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onAbrirModal("parcelamento", p)} className="text-gray-500 hover:text-indigo-400 p-1.5 rounded-lg">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onRemoveParcelamento(p.id)} className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assinaturas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">
                Assinaturas <span className="text-gray-500 font-normal">({assinaturasAtivas.length} ativas)</span>
              </h4>
              <button onClick={() => onAbrirModal("assinatura")} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                <Plus size={14} /> Nova assinatura
              </button>
            </div>
            {assinaturasDoCartao.length === 0 ? (
              <p className="text-sm text-gray-600 py-2 text-center">Nenhuma assinatura cadastrada</p>
            ) : (
              <div className="flex flex-col gap-2">
                {assinaturasDoCartao.map((a) => (
                  <div key={a.id} className={`group flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                    a.ativa ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-800/50 opacity-50"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <RefreshCw size={13} className={a.ativa ? "text-purple-400 shrink-0" : "text-gray-600 shrink-0"} />
                        <span className={`text-sm font-medium truncate ${a.ativa ? "text-white" : "text-gray-500 line-through"}`}>
                          {a.descricao}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">{a.categoria}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">
                        {a.ativa ? `Cobrado todo dia ${a.diaCobranca}` : "Cancelada"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${a.ativa ? "text-white" : "text-gray-500"}`}>
                        {formatBRL(a.valor)}/mês
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onAbrirModal("assinatura", a)} title="Editar" className="text-gray-500 hover:text-indigo-400 p-1.5 rounded-lg">
                        <Pencil size={14} />
                      </button>
                      {a.ativa && (
                        <button onClick={() => onCancelarAssinatura(a.id)} title="Cancelar assinatura" className="text-gray-500 hover:text-yellow-400 p-1.5 rounded-lg">
                          <XCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => onRemoveAssinatura(a.id)} title="Remover" className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── LISTA DE LANÇAMENTOS DA FATURA COM "EXIBIR MAIS" ──────

const PAGE_SIZE = 10;

function ListaFatura({ parcelasInvoice, assinaturasInvoice, gastosInvoice, invoiceMes, faturaAtual }: {
  parcelasInvoice: Parcelamento[];
  assinaturasInvoice: Assinatura[];
  gastosInvoice: GastoVariavel[];
  invoiceMes: number;
  faturaAtual: number;
}) {
  const [visiveis, setVisiveis] = useState(PAGE_SIZE);

  const itens = [
    ...parcelasInvoice.map(p => ({ key: p.id, tipo: "parcela" as const, data: p })),
    ...assinaturasInvoice.map(a => ({ key: a.id, tipo: "assinatura" as const, data: a })),
    ...gastosInvoice.map(g => ({ key: g.id, tipo: "gasto" as const, data: g })),
  ];

  const temMais = visiveis < itens.length;

  return (
    <div className="flex flex-col rounded-xl border border-gray-800 overflow-hidden">
      <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-800">
        {itens.length === 0 && (
          <p className="text-sm text-gray-600 px-3 py-4 text-center">Nenhum lançamento nesta fatura</p>
        )}

        {itens.slice(0, visiveis).map(({ key, tipo, data }) => {
          if (tipo === "parcela") {
            const p = data as Parcelamento;
            const num = invoiceMes - p.mesInicio + 1;
            return (
              <div key={key} className="flex justify-between items-center px-3 py-2.5 bg-gray-800/30">
                <div>
                  <p className="text-sm text-white">{p.descricao}</p>
                  <p className="text-xs text-gray-500">{num}/{p.totalParcelas}x · {p.categoria}</p>
                </div>
                <span className="text-sm font-semibold text-white">{formatBRL(p.valorParcela)}</span>
              </div>
            );
          }
          if (tipo === "assinatura") {
            const a = data as Assinatura;
            return (
              <div key={key} className="flex justify-between items-center px-3 py-2.5 bg-indigo-950/20">
                <div>
                  <p className="text-sm text-white">{a.descricao}</p>
                  <p className="text-xs text-indigo-400">Assinatura · Dia {a.diaCobranca} · {a.categoria}</p>
                </div>
                <span className="text-sm font-semibold text-white">{formatBRL(a.valor)}</span>
              </div>
            );
          }
          const g = data as GastoVariavel;
          return (
            <div key={key} className="flex justify-between items-center px-3 py-2.5 bg-gray-800/30">
              <div>
                <p className="text-sm text-white">{g.descricao}</p>
                <p className="text-xs text-gray-500">{g.categoria} · {new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
              <span className="text-sm font-semibold text-white">{formatBRL(g.valor)}</span>
            </div>
          );
        })}

        {temMais && (
          <button
            onClick={() => setVisiveis(v => v + PAGE_SIZE)}
            className="w-full px-3 py-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 transition-colors text-center"
          >
            Exibir mais ({itens.length - visiveis} restantes)
          </button>
        )}
      </div>

      <div className="flex justify-between items-center px-3 py-2.5 bg-gray-800/60 border-t border-gray-700">
        <span className="text-sm font-semibold text-gray-300">Total estimado</span>
        <span className="text-sm font-bold text-white">{formatBRL(faturaAtual)}</span>
      </div>
    </div>
  );
}
