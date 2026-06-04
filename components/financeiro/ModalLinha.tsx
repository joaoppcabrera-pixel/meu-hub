"use client";

import { useState } from "react";
import { LinhaFinanceira, MESES, MESES_KEYS, formatBRL } from "@/lib/financeiro-data";
import { X } from "lucide-react";

interface Props {
  linha: LinhaFinanceira | null;
  onSalvar: (linha: LinhaFinanceira) => void;
  onFechar: () => void;
}

const CATEGORIAS = ["Moradia", "Impostos", "SaÃºde", "ServiÃ§os", "CartÃµes", "DÃ­vidas", "Investimentos", "Outros"];

export default function ModalLinha({ linha, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState(linha?.nome ?? "");
  const [tipo, setTipo] = useState<"entrada" | "gasto">(linha?.tipo ?? "gasto");
  const [categoria, setCategoria] = useState(linha?.categoria ?? "Outros");
  const [modoValor, setModoValor] = useState<"fixo" | "variavel">("fixo");
  const [valorFixo, setValorFixo] = useState(
    linha ? Object.values(linha.valores)[0]?.toString() ?? "0" : "0"
  );
  const [valores, setValores] = useState<Record<string, string>>(
    linha
      ? Object.fromEntries(MESES_KEYS.map((m) => [m, (linha.valores[m] ?? 0).toString()]))
      : Object.fromEntries(MESES_KEYS.map((m) => [m, "0"]))
  );

  function handleSalvar() {
    if (!nome.trim()) return;

    const valoresFinal: Record<string, number> =
      modoValor === "fixo"
        ? Object.fromEntries(MESES_KEYS.map((m) => [m, parseFloat(valorFixo) || 0]))
        : Object.fromEntries(MESES_KEYS.map((m) => [m, parseFloat(valores[m]) || 0]));

    onSalvar({
      id: linha?.id ?? `linha-${Date.now()}`,
      nome: nome.trim(),
      tipo,
      categoria: tipo === "gasto" ? categoria : undefined,
      valores: valoresFinal,
      pagos: linha?.pagos ?? {},
      pagosContas: linha?.pagosContas ?? {},
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">
            {linha ? "Editar linha" : "Nova linha"}
          </h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Nome */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Aluguel, SalÃ¡rio..."
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Tipo</label>
            <div className="flex gap-2">
              {(["entrada", "gasto"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    tipo === t
                      ? t === "entrada" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {t === "entrada" ? "Entrada" : "Gasto"}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria (sÃ³ gastos) */}
          {tipo === "gasto" && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Modo valor */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Valor</label>
            <div className="flex gap-2 mb-3">
              {(["fixo", "variavel"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModoValor(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    modoValor === m ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {m === "fixo" ? "Mesmo valor todo mÃªs" : "Valor por mÃªs"}
                </button>
              ))}
            </div>

            {modoValor === "fixo" ? (
              <input
                type="number"
                value={valorFixo}
                onChange={(e) => setValorFixo(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="0,00"
              />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {MESES_KEYS.map((mes, i) => (
                  <div key={mes}>
                    <label className="text-xs text-gray-500 mb-1 block">{MESES[i]}</label>
                    <input
                      type="number"
                      value={valores[mes]}
                      onChange={(e) => setValores({ ...valores, [mes]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button
            onClick={onFechar}
            className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}


