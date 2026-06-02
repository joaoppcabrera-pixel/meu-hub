"use client";

import {
  Conta, Cartao, Parcelamento, GastoVariavel, Reserva, Entrada,
  saldoConta, faturaCartaoMes, limiteDisponivel,
} from "@/lib/financeiro-types";
import { LinhaFinanceira, MESES_KEYS, formatBRL, calcularNet, calcularTotalMes } from "@/lib/financeiro-data";
import { Wallet, CreditCard, TrendingDown, PiggyBank, AlertTriangle, CheckCircle, Info, Pin } from "lucide-react";

interface Props {
  contas: Conta[];
  cartoes: Cartao[];
  linhasFixas: LinhaFinanceira[];
  entradas: Entrada[];
  parcelamentos: Parcelamento[];
  gastosVariaveis: GastoVariavel[];
  reservas: Reserva[];
}

export default function VisaoGeralTab({ contas, cartoes, linhasFixas, entradas, parcelamentos, gastosVariaveis, reservas }: Props) {
  const mesAtualIdx = new Date().getMonth();
  const proximoMesIdx = Math.min(mesAtualIdx + 1, 11);
  const mesAtual = MESES_KEYS[mesAtualIdx];

  // Saldo total cumulativo em conta (acumula desde o início)
  const saldoTotal = contas.reduce((acc, c) => acc + saldoConta(c, entradas, gastosVariaveis, mesAtualIdx), 0);

  // Faturas
  const faturaTotal = cartoes.reduce((acc, c) => acc + faturaCartaoMes(parcelamentos, gastosVariaveis, c.id, mesAtualIdx), 0);

  // Gastos variáveis do mês
  const gastosVarMes = gastosVariaveis
    .filter((g) => new Date(g.data).getMonth() === mesAtualIdx)
    .reduce((acc, g) => acc + g.valor, 0);

  // Total reservado
  const totalReservado = reservas.reduce((acc, r) => acc + r.saldoAtual, 0);

  // Net do mês atual e próximo
  const netAtual = calcularNet(linhasFixas, mesAtual);
  const netProximo = calcularNet(linhasFixas, MESES_KEYS[proximoMesIdx]);

  // Disponível para gastar no crédito
  const disponivel = limiteDisponivel(faturaTotal, netProximo);

  const hoje = new Date().getDate();

  // Contas não pagas com vencimento definido, ordenadas por urgência
  const proximasContas = linhasFixas
    .filter((l) => l.tipo === "gasto" && (l.valores[mesAtual] ?? 0) > 0 && !l.pagos[mesAtual])
    .sort((a, b) => {
      // Com dia definido primeiro, ordenado por proximidade do vencimento
      const diaA = a.diaVencimento ?? 99;
      const diaB = b.diaVencimento ?? 99;
      return diaA - diaB;
    })
    .slice(0, 6);

  // Alertas: contas que vencem em até 3 dias e ainda não foram pagas
  const alertasUrgentes = linhasFixas.filter((l) =>
    l.tipo === "gasto" &&
    (l.valores[mesAtual] ?? 0) > 0 &&
    !l.pagos[mesAtual] &&
    l.diaVencimento !== undefined &&
    l.diaVencimento >= hoje &&
    l.diaVencimento <= hoje + 3
  );

  const alertasAtrasados = linhasFixas.filter((l) =>
    l.tipo === "gasto" &&
    (l.valores[mesAtual] ?? 0) > 0 &&
    !l.pagos[mesAtual] &&
    l.diaVencimento !== undefined &&
    l.diaVencimento < hoje
  );

  // Insights: top categorias gastos variáveis
  const porCategoria = gastosVariaveis
    .filter((g) => new Date(g.data).getMonth() === mesAtualIdx)
    .reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + g.valor;
      return acc;
    }, {});
  const topCategorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Percentual gasto do orçamento
  const totalGastosFixos = calcularTotalMes(linhasFixas, "gasto", mesAtual);
  const totalGastosFixosPagos = linhasFixas
    .filter((l) => l.tipo === "gasto" && l.pagos[mesAtual])
    .reduce((acc, l) => acc + (l.valores[mesAtual] ?? 0), 0);
  const percFixosPago = totalGastosFixos > 0 ? (totalGastosFixosPagos / totalGastosFixos) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          icon={<Wallet size={20} />}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
          label="Saldo em conta"
          value={formatBRL(saldoTotal)}
          sub="após gastos variáveis"
          trend={saldoTotal > 0 ? "positive" : "negative"}
        />
        <MetricCard
          icon={<Pin size={20} />}
          iconBg="bg-red-500/15"
          iconColor="text-red-400"
          label="Gastos fixos pagos"
          value={formatBRL(totalGastosFixosPagos)}
          sub={`de ${formatBRL(totalGastosFixos)} projetado`}
          trend="neutral"
        />
        <MetricCard
          icon={<CreditCard size={20} />}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
          label="Faturas estimadas"
          value={formatBRL(faturaTotal)}
          sub="total dos cartões"
          trend={faturaTotal > netProximo ? "negative" : "neutral"}
        />
        <MetricCard
          icon={<TrendingDown size={20} />}
          iconBg="bg-orange-500/15"
          iconColor="text-orange-400"
          label="Gastos variáveis"
          value={formatBRL(gastosVarMes)}
          sub="este mês"
          trend="neutral"
        />
        <MetricCard
          icon={<PiggyBank size={20} />}
          iconBg="bg-blue-500/15"
          iconColor="text-blue-400"
          label="Total reservado"
          value={formatBRL(totalReservado)}
          sub="reservas e investimentos"
          trend="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: saldos e faturas */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Saldo por conta */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white mb-1">Saldo por conta</h4>
            <p className="text-xs text-gray-500 mb-4">Acumulado desde o início · entradas − débitos</p>
            <div className="flex flex-col gap-3">
              {contas.map((c) => {
                const saldo = saldoConta(c, entradas, gastosVariaveis, mesAtualIdx);
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-sm text-gray-300">{c.nome}</span>
                    </div>
                    <span className={`text-sm font-semibold ${saldo >= 0 ? "text-white" : "text-red-400"}`}>
                      {formatBRL(saldo)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Faturas por cartão */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Faturas dos cartões</h4>
            <div className="flex flex-col gap-3">
              {cartoes.map((c) => {
                const fatura = faturaCartaoMes(parcelamentos, gastosVariaveis, c.id, mesAtualIdx);
                const perc = c.limite > 0 ? (fatura / c.limite) * 100 : 0;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-300">{c.nome}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-white">{formatBRL(fatura)}</span>
                        <span className="text-xs text-gray-500 ml-1.5">de {formatBRL(c.limite)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${perc > 80 ? "bg-red-500" : perc > 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(perc, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alertas de vencimento */}
          {(alertasAtrasados.length > 0 || alertasUrgentes.length > 0) && (
            <div className="flex flex-col gap-2">
              {alertasAtrasados.map((l) => (
                <div key={l.id} className="flex items-center gap-3 bg-red-950/40 border border-red-800/50 rounded-2xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{l.nome}</p>
                    <p className="text-xs text-red-400">Venceu dia {l.diaVencimento} — não pago</p>
                  </div>
                  <span className="text-sm font-bold text-red-300">{formatBRL(l.valores[mesAtual] ?? 0)}</span>
                </div>
              ))}
              {alertasUrgentes.map((l) => (
                <div key={l.id} className="flex items-center gap-3 bg-orange-950/40 border border-orange-800/50 rounded-2xl px-4 py-3">
                  <AlertTriangle size={16} className="text-orange-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{l.nome}</p>
                    <p className="text-xs text-orange-400">
                      {l.diaVencimento === hoje ? "Vence hoje!" : `Vence em ${l.diaVencimento! - hoje} dia${l.diaVencimento! - hoje > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-orange-300">{formatBRL(l.valores[mesAtual] ?? 0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gastos fixos do mês */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">Gastos fixos do mês</h4>
              <span className="text-xs text-gray-500">{percFixosPago.toFixed(0)}% pagos</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${percFixosPago}%` }} />
            </div>
            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Próximas a pagar</h5>
            {proximasContas.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={16} /> Todas as contas do mês foram pagas!
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {proximasContas.map((l) => {
                  const atrasada = l.diaVencimento !== undefined && l.diaVencimento < hoje;
                  const urgente = l.diaVencimento !== undefined && l.diaVencimento >= hoje && l.diaVencimento <= hoje + 3;
                  return (
                    <div key={l.id} className="flex justify-between items-center py-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">{l.nome}</span>
                        {l.diaVencimento && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                            atrasada ? "bg-red-500/15 text-red-400" :
                            urgente  ? "bg-orange-500/15 text-orange-400" :
                                       "bg-gray-700 text-gray-500"
                          }`}>
                            dia {l.diaVencimento}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white">{formatBRL(l.valores[mesAtual] ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: insights */}
        <div className="flex flex-col gap-4">
          {/* Limite disponível no crédito */}
          <div className={`rounded-2xl p-5 border ${
            disponivel > 0 ? "bg-indigo-950/30 border-indigo-800/40" : "bg-red-950/30 border-red-800/40"
          }`}>
            <div className="flex items-start gap-2 mb-3">
              {disponivel > 0 ? <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />}
              <h4 className="text-sm font-semibold text-white">Limite disponível no crédito</h4>
            </div>
            <p className={`text-3xl font-bold mb-2 ${disponivel > 0 ? "text-indigo-300" : "text-red-400"}`}>
              {formatBRL(disponivel)}
            </p>
            <p className="text-xs text-gray-400">
              {disponivel > 0
                ? `Se você gastar mais de ${formatBRL(disponivel)} no crédito, sua fatura de próximo mês vai superar seu net de ${formatBRL(netProximo)}.`
                : `Sua fatura atual já ultrapassa o net projetado do próximo mês (${formatBRL(netProximo)}).`}
            </p>
          </div>

          {/* Insights de gastos */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Onde você mais gastou</h4>
            {topCategorias.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhum gasto variável registrado este mês</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCategorias.map(([cat, val]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{cat}</span>
                      <span className="text-white font-medium">{formatBRL(val)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${gastosVarMes > 0 ? (val / gastosVarMes) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Net do mês */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Net projetado</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Mês atual</span>
                <span className={`text-sm font-semibold ${netAtual >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatBRL(netAtual)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Próximo mês</span>
                <span className={`text-sm font-semibold ${netProximo >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatBRL(netProximo)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, iconBg, iconColor, label, value, sub, trend }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  trend: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
      <div className={`${iconBg} ${iconColor} p-2.5 rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-bold truncate ${
          trend === "positive" ? "text-white" : trend === "negative" ? "text-red-400" : "text-white"
        }`}>{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
