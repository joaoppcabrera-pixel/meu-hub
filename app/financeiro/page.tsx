"use client";

import { useState, useMemo } from "react";
import { linhasIniciais, LinhaFinanceira, CATEGORIAS_PADRAO } from "@/lib/financeiro-data";
import { Parcelamento, GastoVariavel, Reserva, Entrada, Conta, Cartao } from "@/lib/financeiro-types";
import { useFinanceiroConfig } from "@/lib/config-store";
import { getBanco } from "@/lib/bancos";
import VisaoGeralTab from "@/components/financeiro/VisaoGeralTab";
import EntradasTab from "@/components/financeiro/EntradasTab";
import GastosFixosTab from "@/components/financeiro/GastosFixosTab";
import CartaoTab from "@/components/financeiro/CartaoTab";
import GastosVariaveisTab from "@/components/financeiro/GastosVariaveisTab";
import ReservasTab from "@/components/financeiro/ReservasTab";
import { LayoutDashboard, TrendingUp, Pin, CreditCard, Receipt, PiggyBank } from "lucide-react";

type Aba = "geral" | "entradas" | "fixos" | "cartoes" | "variaveis" | "reservas";

const ABAS: { id: Aba; label: string; icon: React.ReactNode }[] = [
  { id: "geral",     label: "Visão Geral",     icon: <LayoutDashboard size={16} /> },
  { id: "entradas",  label: "Entradas",         icon: <TrendingUp size={16} />      },
  { id: "fixos",     label: "Gastos Fixos",     icon: <Pin size={16} />             },
  { id: "cartoes",   label: "Cartões",           icon: <CreditCard size={16} />     },
  { id: "variaveis", label: "Gastos Variáveis", icon: <Receipt size={16} />         },
  { id: "reservas",  label: "Reservas",          icon: <PiggyBank size={16} />      },
];

export default function Financeiro() {
  const [aba, setAba] = useState<Aba>("geral");
  const { contas: contasBancarias, categorias } = useFinanceiroConfig();

  // Deriva Conta[] e Cartao[] a partir do cadastro de configurações
  const contas = useMemo<Conta[]>(() =>
    contasBancarias
      .filter((c) => c.tipo === "corrente" || c.tipo === "investimento")
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        banco: getBanco(c.bancoId).nome,
        tipo: c.tipo === "investimento" ? "poupanca" : "corrente",
        saldoInicial: c.saldoInicial,
        cor: getBanco(c.bancoId).text,
      })),
    [contasBancarias]
  );

  const cartoes = useMemo<Cartao[]>(() =>
    contasBancarias
      .filter((c) => c.tipo === "cartao")
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        limite: c.limite ?? 0,
        diaFechamento: c.diaFechamento ?? 10,
        diaVencimento: c.diaVencimento ?? 17,
        contaDebitoId: c.id,
        cor: getBanco(c.bancoId).bg,
      })),
    [contasBancarias]
  );

  const nomesCategoria = useMemo(
    () => categorias.map((c) => c.nome),
    [categorias]
  );

  const [linhasFixas, setLinhasFixas] = useState<LinhaFinanceira[]>(linhasIniciais);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([]);
  const [gastosVariaveis, setGastosVariaveis] = useState<GastoVariavel[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Financeiro</h2>
        <p className="text-gray-400 mt-1">Gestão financeira completa</p>
      </div>

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 mb-6 overflow-x-auto">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              aba === a.id ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {a.icon}{a.label}
          </button>
        ))}
      </div>

      {aba === "geral" && (
        <VisaoGeralTab
          contas={contas} cartoes={cartoes} linhasFixas={linhasFixas}
          entradas={entradas} parcelamentos={parcelamentos}
          gastosVariaveis={gastosVariaveis} reservas={reservas}
        />
      )}
      {aba === "entradas" && (
        <EntradasTab
          entradas={entradas} contas={contas}
          onAdd={(e) => setEntradas((p) => [...p, e])}
          onRemove={(id) => setEntradas((p) => p.filter((e) => e.id !== id))}
        />
      )}
      {aba === "fixos" && (
        <GastosFixosTab
          linhas={linhasFixas} categorias={nomesCategoria}
          onChange={setLinhasFixas}
          onNovaCategoriaFixa={() => {}}
        />
      )}
      {aba === "cartoes" && (
        <CartaoTab
          cartoes={cartoes} parcelamentos={parcelamentos} gastosVariaveis={gastosVariaveis}
          onAddParcelamento={(p) => setParcelamentos((prev) => [...prev, p])}
          onRemoveParcelamento={(id) => setParcelamentos((prev) => prev.filter((p) => p.id !== id))}
        />
      )}
      {aba === "variaveis" && (
        <GastosVariaveisTab
          gastos={gastosVariaveis} cartoes={cartoes} contas={contas}
          onAdd={(g) => setGastosVariaveis((p) => [...p, g])}
          onRemove={(id) => setGastosVariaveis((p) => p.filter((g) => g.id !== id))}
        />
      )}
      {aba === "reservas" && (
        <ReservasTab
          reservas={reservas}
          onAdd={(r) => setReservas((p) => [...p, r])}
          onUpdate={(r) => setReservas((p) => p.map((x) => (x.id === r.id ? r : x)))}
          onRemove={(id) => setReservas((p) => p.filter((r) => r.id !== id))}
        />
      )}
    </div>
  );
}
