"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { linhasIniciais } from "@/lib/financeiro-data";
import { Conta, Cartao, faturaCartaoMes } from "@/lib/financeiro-types";
import { MESES_KEYS } from "@/lib/financeiro-data";
import { useConfig } from "@/lib/hooks/useConfig";
import { useLinhasFixas } from "@/lib/hooks/useLinhasFixas";
import { useEntradas } from "@/lib/hooks/useEntradas";
import { useParcelamentos } from "@/lib/hooks/useParcelamentos";
import { useGastosVariaveis } from "@/lib/hooks/useGastosVariaveis";
import { useReservas } from "@/lib/hooks/useReservas";
import { useAssinaturas } from "@/lib/hooks/useAssinaturas";
import { useAuth } from "@/lib/auth-context";
import { getBanco } from "@/lib/bancos";
import VisaoGeralTab from "@/components/financeiro/VisaoGeralTab";
import EntradasTab from "@/components/financeiro/EntradasTab";
import GastosFixosTab from "@/components/financeiro/GastosFixosTab";
import CartaoTab from "@/components/financeiro/CartaoTab";
import GastosVariaveisTab from "@/components/financeiro/GastosVariaveisTab";
import ReservasTab from "@/components/financeiro/ReservasTab";
import { LayoutDashboard, TrendingUp, Pin, CreditCard, Receipt, PiggyBank, Loader2 } from "lucide-react";

type Aba = "geral" | "entradas" | "fixos" | "cartoes" | "variaveis" | "reservas";

const ABAS: { id: Aba; label: string; icon: React.ReactNode }[] = [
  { id: "geral",     label: "Visão Geral",     icon: <LayoutDashboard size={16} /> },
  { id: "variaveis", label: "Gastos Variáveis", icon: <Receipt size={16} />        },
  { id: "fixos",     label: "Gastos Fixos",     icon: <Pin size={16} />            },
  { id: "cartoes",   label: "Cartões",           icon: <CreditCard size={16} />    },
  { id: "entradas",  label: "Entradas",          icon: <TrendingUp size={16} />    },
  { id: "reservas",  label: "Reservas",          icon: <PiggyBank size={16} />     },
];

export default function Financeiro() {
  const [aba, setAba] = useState<Aba>("geral");
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { contas: contasBancarias, categorias, loading: loadingConfig } = useConfig(userId);
  const { linhas: linhasFixas, setLinhas: setLinhasFixas, loading: loadingFixas } = useLinhasFixas(userId);
  const { entradas, loading: loadingEntradas, add: addEntrada, remove: removeEntrada } = useEntradas(userId);
  const { parcelamentos, loading: loadingParc, add: addParcelamento, update: updateParcelamento, remove: removeParcelamento } = useParcelamentos(userId);
  const { gastos: gastosVariaveis, loading: loadingGastos, add: addGasto, remove: removeGasto } = useGastosVariaveis(userId);
  const { reservas, loading: loadingReservas, add: addReserva, update: updateReserva, remove: removeReserva } = useReservas(userId);
  const { assinaturas, loading: loadingAss, add: addAssinatura, update: updateAssinatura, cancelar: cancelarAssinatura, remove: removeAssinatura } = useAssinaturas(userId);

  const loading = loadingConfig || loadingFixas || loadingEntradas || loadingParc || loadingGastos || loadingReservas || loadingAss;

  const contas = useMemo<Conta[]>(() =>
    contasBancarias
      .filter(c => c.tipo === "corrente" || c.tipo === "investimento")
      .map(c => ({
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
      .filter(c => c.tipo === "cartao")
      .map(c => ({
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

  const nomesCategoria = useMemo(() => categorias.map(c => c.nome), [categorias]);

  // Auto-cria uma linha de fatura para cada cartão que ainda não tem uma
  const cartoesInicializadosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (loading) return;
    const novas = cartoes.filter(c =>
      !cartoesInicializadosRef.current.has(c.id) &&
      !linhasFixas.some(l => l.cartaoVinculadoId === c.id)
    );
    if (novas.length === 0) return;
    novas.forEach(c => cartoesInicializadosRef.current.add(c.id));
    setLinhasFixas([
      ...linhasFixas,
      ...novas.map(c => ({
        id: `fatura-${c.id}`,
        nome: `Fatura ${c.nome}`,
        tipo: "gasto" as const,
        categoria: "Cartões",
        cartaoVinculadoId: c.id,
        diaVencimento: c.diaVencimento,
        valores: Object.fromEntries(MESES_KEYS.map(m => [m, 0])),
        pagos: {},
        pagosContas: {},
      })),
    ]);
  }, [cartoes, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Substitui os valores das linhas vinculadas a cartões pelos valores reais da fatura
  const linhasComFaturas = useMemo(() =>
    linhasFixas.map(l => {
      if (!l.cartaoVinculadoId) return l;
      const cartao = cartoes.find(c => c.id === l.cartaoVinculadoId);
      if (!cartao) return l;
      const valores = Object.fromEntries(
        MESES_KEYS.map((mes, idx) => [
          mes,
          faturaCartaoMes(parcelamentos, gastosVariaveis, cartao.id, idx, cartao.diaFechamento, assinaturas),
        ])
      );
      return { ...l, valores };
    }),
    [linhasFixas, cartoes, parcelamentos, gastosVariaveis, assinaturas]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Financeiro</h2>
        <p className="text-gray-400 mt-1">Gestão financeira completa</p>
      </div>

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 mb-6 overflow-x-auto">
        {ABAS.map(a => (
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
          contas={contas} cartoes={cartoes} linhasFixas={linhasComFaturas}
          entradas={entradas} parcelamentos={parcelamentos}
          gastosVariaveis={gastosVariaveis} assinaturas={assinaturas} reservas={reservas}
        />
      )}
      {aba === "entradas" && (
        <EntradasTab
          entradas={entradas} contas={contas}
          onAdd={addEntrada} onRemove={removeEntrada}
        />
      )}
      {aba === "fixos" && (
        <GastosFixosTab
          linhas={linhasComFaturas} categorias={nomesCategoria} contas={contas} cartoes={cartoes}
          onChange={setLinhasFixas}
          onNovaCategoriaFixa={() => {}}
        />
      )}
      {aba === "cartoes" && (
        <CartaoTab
          cartoes={cartoes} parcelamentos={parcelamentos}
          gastosVariaveis={gastosVariaveis} assinaturas={assinaturas}
          onAddParcelamento={addParcelamento} onUpdateParcelamento={updateParcelamento} onRemoveParcelamento={removeParcelamento}
          onAddAssinatura={addAssinatura} onUpdateAssinatura={updateAssinatura} onCancelarAssinatura={cancelarAssinatura} onRemoveAssinatura={removeAssinatura}
        />
      )}
      {aba === "variaveis" && (
        <GastosVariaveisTab
          gastos={gastosVariaveis} cartoes={cartoes} contas={contas}
          onAdd={addGasto} onRemove={removeGasto}
        />
      )}
      {aba === "reservas" && (
        <ReservasTab
          reservas={reservas} contas={contas}
          onAdd={addReserva} onUpdate={updateReserva} onRemove={removeReserva}
        />
      )}
    </div>
  );
}
