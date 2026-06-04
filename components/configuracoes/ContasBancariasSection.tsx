"use client";

import { useState } from "react";
import { ContaBancaria, TipoContaBancaria } from "@/lib/config-store";
import { BANCOS, getBanco } from "@/lib/bancos";
import { formatBRL } from "@/lib/financeiro-data";
import { Plus, Pencil, Trash2, CreditCard, Landmark, TrendingUp, X, ChevronLeft } from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface Props {
  contas: ContaBancaria[];
  onAdd: (c: ContaBancaria) => void;
  onUpdate: (c: ContaBancaria) => void;
  onRemove: (id: string) => void;
}

const TIPO_INFO: Record<TipoContaBancaria, { label: string; icon: React.ReactNode; desc: string }> = {
  corrente:    { label: "Conta Corrente",   icon: <Landmark size={20} />,  desc: "Para pagamentos e transferências do dia a dia" },
  cartao:      { label: "Cartão de Crédito",icon: <CreditCard size={20} />,desc: "Com limite, data de fechamento e vencimento"  },
  investimento:{ label: "Investimentos",    icon: <TrendingUp size={20} />,desc: "Conta de custódia, corretora ou poupança"       },
};

export default function ContasBancariasSection({ contas, onAdd, onUpdate, onRemove }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ContaBancaria | null>(null);

  // Agrupa por banco
  const bancos = Array.from(new Set(contas.map((c) => c.bancoId)));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Contas Bancárias</h3>
          <p className="text-sm text-gray-500 mt-0.5">Bancos, cartões e contas de investimento</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAberto(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {contas.length === 0 ? (
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-2">Nenhuma conta cadastrada</p>
          <button onClick={() => setModalAberto(true)} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            + Adicionar primeira conta
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bancos.map((bancoId) => {
            const banco = getBanco(bancoId);
            const contasDoBanco = contas.filter((c) => c.bancoId === bancoId);
            return (
              <div key={bancoId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Header do banco */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                  <div className={`w-8 h-8 rounded-lg ${banco.bg} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{banco.sigla}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{banco.nome}</span>
                  <span className="text-xs text-gray-500">{contasDoBanco.length} {contasDoBanco.length === 1 ? "produto" : "produtos"}</span>
                </div>

                {/* Lista de contas */}
                <div className="divide-y divide-gray-800">
                  {contasDoBanco.map((conta) => {
                    const tipo = TIPO_INFO[conta.tipo];
                    return (
                      <div key={conta.id} className="group flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-500">{tipo.icon}</div>
                          <div>
                            <p className="text-sm font-medium text-white">{conta.nome}</p>
                            <p className="text-xs text-gray-500">
                              {tipo.label}
                              {conta.tipo === "cartao" && conta.limite ? ` · Limite ${formatBRL(conta.limite)}` : ""}
                              {conta.tipo === "cartao" && conta.diaFechamento ? ` · Fecha dia ${conta.diaFechamento}` : ""}
                              {(conta.tipo === "corrente" || conta.tipo === "investimento") && conta.saldoInicial
                                ? ` · Saldo inicial ${formatBRL(conta.saldoInicial)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditando(conta); setModalAberto(true); }}
                            className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onRemove(conta.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
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
        <ModalConta
          conta={editando}
          onSalvar={(c) => {
            editando ? onUpdate(c) : onAdd(c);
            setModalAberto(false);
            setEditando(null);
          }}
          onFechar={() => { setModalAberto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}

// ── MODAL ──────────────────────────────────────────────────

type Passo = "banco" | "tipo" | "detalhes";

function ModalConta({ conta, onSalvar, onFechar }: {
  conta: ContaBancaria | null;
  onSalvar: (c: ContaBancaria) => void;
  onFechar: () => void;
}) {
  const isEdicao = !!conta;
  const [passo, setPasso] = useState<Passo>(isEdicao ? "detalhes" : "banco");
  const [bancoId, setBancoId] = useState(conta?.bancoId ?? "");
  const [tipo, setTipo] = useState<TipoContaBancaria>(conta?.tipo ?? "corrente");
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [saldoInicial, setSaldoInicial] = useState(conta?.saldoInicial ?? 0);
  const [limite, setLimite] = useState(conta?.limite ?? 0);
  const [diaFechamento, setDiaFechamento] = useState(conta?.diaFechamento?.toString() ?? "");
  const [diaVencimento, setDiaVencimento] = useState(conta?.diaVencimento?.toString() ?? "");

  const banco = getBanco(bancoId);

  function gerarNome(bId: string, t: TipoContaBancaria) {
    const b = getBanco(bId);
    return `${b.nome} — ${TIPO_INFO[t].label}`;
  }

  function handleSelecionarBanco(id: string) {
    setBancoId(id);
    setPasso("tipo");
  }

  function handleSelecionarTipo(t: TipoContaBancaria) {
    setTipo(t);
    if (!nome) setNome(gerarNome(bancoId, t));
    setPasso("detalhes");
  }

  function handleSalvar() {
    onSalvar({
      id: conta?.id ?? `conta-${Date.now()}`,
      bancoId,
      nome: nome || gerarNome(bancoId, tipo),
      tipo,
      saldoInicial,
      limite: tipo === "cartao" ? limite : undefined,
      diaFechamento: tipo === "cartao" ? parseInt(diaFechamento) || undefined : undefined,
      diaVencimento: tipo === "cartao" ? parseInt(diaVencimento) || undefined : undefined,
    });
  }

  const podeSalvar = bancoId && tipo && nome.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {passo !== "banco" && !isEdicao && (
              <button
                onClick={() => setPasso(passo === "detalhes" ? "tipo" : "banco")}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="text-white font-semibold text-lg">
              {isEdicao ? "Editar conta" : passo === "banco" ? "Selecionar banco" : passo === "tipo" ? "Tipo de conta" : "Detalhes"}
            </h3>
          </div>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Passo 1: Banco */}
        {passo === "banco" && (
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2">
              {BANCOS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelecionarBanco(b.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-800 hover:border-indigo-500 hover:bg-indigo-950/20 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{b.sigla}</span>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-white text-center leading-tight">{b.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Passo 2: Tipo */}
        {passo === "tipo" && (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className={`w-10 h-10 rounded-xl ${banco.bg} flex items-center justify-center shrink-0`}>
                <span className="text-sm font-bold text-white">{banco.sigla}</span>
              </div>
              <div>
                <p className="text-white font-medium">{banco.nome}</p>
                <p className="text-xs text-gray-500">Selecione o tipo de conta</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {(Object.keys(TIPO_INFO) as TipoContaBancaria[]).map((t) => {
                const info = TIPO_INFO[t];
                return (
                  <button
                    key={t}
                    onClick={() => handleSelecionarTipo(t)}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-700 hover:border-indigo-500 hover:bg-indigo-950/20 transition-all text-left"
                  >
                    <div className="text-gray-400">{info.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{info.label}</p>
                      <p className="text-xs text-gray-500">{info.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Passo 3: Detalhes */}
        {passo === "detalhes" && (
          <div className="p-5 flex flex-col gap-4">
            {/* Preview banco + tipo */}
            {!isEdicao && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg ${banco.bg} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{banco.sigla}</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{banco.nome}</p>
                  <p className="text-xs text-gray-500">{TIPO_INFO[tipo].label}</p>
                </div>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Nome da conta</label>
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Conta corrente / investimento: saldo inicial */}
            {(tipo === "corrente" || tipo === "investimento") && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Saldo inicial</label>
                <CurrencyInput value={saldoInicial} onChange={setSaldoInicial} />
              </div>
            )}

            {/* Cartão: limite + datas */}
            {tipo === "cartao" && (
              <>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Limite</label>
                  <CurrencyInput value={limite} onChange={setLimite} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Dia de fechamento</label>
                    <input
                      type="number"
                      value={diaFechamento}
                      onChange={(e) => setDiaFechamento(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Ex: 10"
                      min="1" max="31"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Dia de vencimento</label>
                    <input
                      type="number"
                      value={diaVencimento}
                      onChange={(e) => setDiaVencimento(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Ex: 17"
                      min="1" max="31"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {passo === "detalhes" && (
          <div className="flex gap-3 p-5 border-t border-gray-800">
            <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={!podeSalvar}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {isEdicao ? "Salvar alterações" : "Adicionar conta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
