"use client";

import { LinhaFinanceira, MESES, MESES_KEYS, calcularTotalMes, formatBRL } from "@/lib/financeiro-data";
import { TrendingDown, CheckCircle2, Clock } from "lucide-react";

interface Props {
  linhas: LinhaFinanceira[];
}

export default function ResumoMes({ linhas }: Props) {
  const mesAtual = MESES_KEYS[new Date().getMonth()] ?? MESES_KEYS[0];
  const mesLabel = MESES[MESES_KEYS.indexOf(mesAtual)] ?? MESES[0];

  const totalGastos = calcularTotalMes(linhas, "gasto", mesAtual);

  const gastosPagos = linhas
    .filter((l) => l.tipo === "gasto" && l.pagos[mesAtual])
    .reduce((acc, l) => acc + (l.valores[mesAtual] ?? 0), 0);

  const gastosPendentes = totalGastos - gastosPagos;
  const percentPago = totalGastos > 0 ? (gastosPagos / totalGastos) * 100 : 0;

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-500 mb-3">Resumo de {mesLabel}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          icon={<TrendingDown size={18} className="text-red-400" />}
          bg="bg-red-400/10"
          label="Total gastos fixos"
          value={formatBRL(totalGastos)}
          valueColor="text-red-400"
        />
        <Card
          icon={<CheckCircle2 size={18} className="text-emerald-400" />}
          bg="bg-emerald-400/10"
          label="Já pagos"
          value={formatBRL(gastosPagos)}
          valueColor="text-emerald-400"
          sub={`${percentPago.toFixed(0)}% do total`}
        />
        <Card
          icon={<Clock size={18} className="text-orange-400" />}
          bg="bg-orange-400/10"
          label="Pendentes"
          value={formatBRL(gastosPendentes)}
          valueColor={gastosPendentes > 0 ? "text-orange-400" : "text-gray-500"}
          sub={gastosPendentes === 0 ? "Tudo em dia! ✓" : undefined}
        />
      </div>
    </div>
  );
}

function Card({ icon, bg, label, value, valueColor, sub }: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  valueColor: string;
  sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
      <div className={`${bg} p-2.5 rounded-xl`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
