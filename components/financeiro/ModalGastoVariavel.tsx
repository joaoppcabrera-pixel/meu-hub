"use client";

import { useState } from "react";
import { GastoVariavel, MeioPagamento, MEIOS_PAGAMENTO, Cartao, Conta, mesInvoiceGasto } from "@/lib/financeiro-types";
import { CATEGORIAS_PADRAO, MESES } from "@/lib/financeiro-data";
import { X } from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface Props {
  cartoes: Cartao[];
  contas: Conta[];
  onSalvar: (g: GastoVariavel) => void;
  onFechar: () => void;
}

export default function ModalGastoVariavel({ cartoes, contas, onSalvar, onFechar }: Props) {
  const hoje = new Date().toISOString().split("T")[0];
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(hoje);
  const [categoria, setCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [meio, setMeio] = useState<MeioPagamento>("debito");
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id ?? "");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");

  const podeSalvar = descricao.trim() && valor > 0;

  function handleSalvar() {
    if (!podeSalvar) return;
    onSalvar({
      id: `gv-${Date.now()}`,
      descricao: descricao.trim(),
      valor,
      data,
      categoria,
      meio,
      cartaoId: meio === "credito" ? cartaoId : undefined,
      contaId: meio === "debito" || meio === "pix" ? contaId : undefined,
    });
  }

  const meios: MeioPagamento[] = ["debito", "credito", "pix", "dinheiro", "va"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Registrar gasto</h3>
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
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              placeholder="Ex: Almoço, Uber, Mercado..."
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Valor</label>
              <CurrencyInput value={valor} onChange={setValor} />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIAS_PADRAO.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Meio de pagamento */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Meio de pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {meios.map((m) => (
                <button
                  key={m}
                  onClick={() => setMeio(m)}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    meio === m ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {MEIOS_PAGAMENTO[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Cartão — só se crédito */}
          {meio === "credito" && cartoes.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Cartão</label>
              <div className="flex gap-2 mb-2">
                {cartoes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCartaoId(c.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      cartaoId === c.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
              {/* Hint: em qual fatura cai */}
              {cartaoId && data && (() => {
                const cartao = cartoes.find(c => c.id === cartaoId);
                if (!cartao) return null;
                const invoiceMes = mesInvoiceGasto(data, cartao.diaFechamento);
                const diaExpensa = new Date(data + "T12:00:00").getDate();
                const caiProxima = diaExpensa > cartao.diaFechamento;
                return (
                  <p className={`text-xs px-3 py-2 rounded-lg ${caiProxima ? "bg-yellow-950/40 text-yellow-400" : "bg-emerald-950/40 text-emerald-400"}`}>
                    {caiProxima
                      ? `⚠️ Dia ${diaExpensa} > fechamento (dia ${cartao.diaFechamento}) — cai na fatura de ${MESES[invoiceMes]}`
                      : `✓ Cai na fatura de ${MESES[invoiceMes]} (fatura atual)`}
                  </p>
                );
              })()}
            </div>
          )}

          {/* Conta — se débito ou pix */}
          {(meio === "debito" || meio === "pix") && contas.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Conta</label>
              <div className="flex gap-2">
                {contas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContaId(c.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      contaId === c.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors">Cancelar</button>
          <button
            onClick={handleSalvar}
            disabled={!podeSalvar}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}
