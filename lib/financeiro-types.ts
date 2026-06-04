import { MESES_KEYS, LinhaFinanceira, mesDate } from "./financeiro-data";

// ── CONTAS ──────────────────────────────────────────────
export interface Conta {
  id: string;
  nome: string;
  banco: string;
  tipo: "corrente" | "poupanca";
  saldoInicial: number;
  cor: string;
}

// ── CARTÕES ──────────────────────────────────────────────
export interface Cartao {
  id: string;
  nome: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  contaDebitoId: string;
  cor: string;
}

// ── PARCELAMENTOS ────────────────────────────────────────
export interface Parcelamento {
  id: string;
  cartaoId: string;
  descricao: string;
  categoria: string;
  valorTotal: number;
  totalParcelas: number;
  mesInicio: number; // índice em MESES_KEYS (0 = jan)
  valorParcela: number;
}

// ── GASTOS VARIÁVEIS ─────────────────────────────────────
export type MeioPagamento = "debito" | "credito" | "pix" | "dinheiro" | "va";

export const MEIOS_PAGAMENTO: Record<MeioPagamento, string> = {
  debito:   "Débito",
  credito:  "Crédito",
  pix:      "Pix",
  dinheiro: "Dinheiro",
  va:       "Vale Alimentação",
};

export interface GastoVariavel {
  id: string;
  descricao: string;
  valor: number;
  data: string; // "2026-06-15"
  categoria: string;
  meio: MeioPagamento;
  cartaoId?: string;
  contaId?: string;
}

// ── ENTRADAS ─────────────────────────────────────────────

export const CATEGORIAS_ENTRADA = [
  "Salário", "Freelance", "Renda Extra", "Dividendos",
  "Aluguel Recebido", "Restituição", "Bônus", "Outros",
];

export interface Entrada {
  id: string;
  descricao: string;
  valor: number;
  data: string;       // "2026-06-05"
  categoria: string;
  contaId: string;
}

// ── ASSINATURAS ──────────────────────────────────────────

export interface Assinatura {
  id: string;
  cartaoId: string;
  descricao: string;
  categoria: string;
  valor: number;
  diaCobranca: number; // dia do mês em que é cobrado
  mesInicio: number;   // 0-based
  mesFim?: number;     // 0-based; undefined = sem fim
  ativa: boolean;
}

// ── RESERVAS E INVESTIMENTOS ─────────────────────────────
export type TipoReserva = "emergencia" | "cdb" | "tesouro" | "acoes" | "fii" | "poupanca" | "outros";

export const TIPOS_RESERVA: Record<TipoReserva, string> = {
  emergencia: "Reserva de Emergência",
  cdb:        "CDB",
  tesouro:    "Tesouro Direto",
  acoes:      "Ações",
  fii:        "FIIs",
  poupanca:   "Poupança",
  outros:     "Outros",
};

export interface Reserva {
  id: string;
  nome: string;
  tipo: TipoReserva;
  saldoAtual: number;
  meta?: number;
  aportes: Record<string, number>;      // "jun" -> valor total aportado
  aportesContas: Record<string, string>; // "jun" -> contaId de onde saiu
}

// ── DADOS INICIAIS ────────────────────────────────────────
export const contasIniciais: Conta[] = [
  {
    id: "c-santander",
    nome: "Conta Santander",
    banco: "Santander",
    tipo: "corrente",
    saldoInicial: 5000,
    cor: "text-red-400",
  },
  {
    id: "c-c6",
    nome: "Conta C6",
    banco: "C6 Bank",
    tipo: "corrente",
    saldoInicial: 2000,
    cor: "text-gray-300",
  },
];

export const cartoesIniciais: Cartao[] = [
  {
    id: "cc-santander",
    nome: "Santander",
    limite: 15000,
    diaFechamento: 10,
    diaVencimento: 17,
    contaDebitoId: "c-santander",
    cor: "bg-red-700",
  },
  {
    id: "cc-c6",
    nome: "C6",
    limite: 5000,
    diaFechamento: 15,
    diaVencimento: 22,
    contaDebitoId: "c-c6",
    cor: "bg-zinc-700",
  },
];

// ── HELPERS ───────────────────────────────────────────────

/** Parcelas ativas de um cartão num mês (índice 0-11) */
export function parcelasDoMes(parcelamentos: Parcelamento[], cartaoId: string, mesIdx: number): Parcelamento[] {
  return parcelamentos.filter((p) => {
    if (p.cartaoId !== cartaoId) return false;
    const fimIdx = p.mesInicio + p.totalParcelas - 1;
    return mesIdx >= p.mesInicio && mesIdx <= fimIdx;
  });
}

/** Total de parcelamentos de um cartão num mês */
export function totalParcelasCartaoMes(parcelamentos: Parcelamento[], cartaoId: string, mesIdx: number): number {
  return parcelasDoMes(parcelamentos, cartaoId, mesIdx).reduce((acc, p) => acc + p.valorParcela, 0);
}

/**
 * Dado uma data e o dia de fechamento do cartão,
 * retorna o mês (0-11) em que a despesa cai na fatura.
 * Se o dia da despesa > diaFechamento, cai na fatura do mês seguinte.
 */
export function mesInvoiceGasto(data: string, diaFechamento: number): number {
  const d = new Date(data + "T12:00:00");
  const dia = d.getDate();
  const mes = d.getMonth();
  return dia > diaFechamento ? (mes + 1) % 12 : mes;
}

/** Status da fatura atual de um cartão */
export function statusFatura(cartao: Cartao): "aberta" | "fechada" {
  const hoje = new Date().getDate();
  return hoje <= cartao.diaFechamento ? "aberta" : "fechada";
}

/** Mês da fatura que está sendo acumulada agora (0-11) */
export function mesInvoiceAtual(cartao: Cartao): number {
  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth();
  return dia > cartao.diaFechamento ? (mes + 1) % 12 : mes;
}

/** Total de gastos variáveis de um cartão num mês, respeitando o dia de fechamento */
export function totalVariaveisCartaoMes(
  gastos: GastoVariavel[],
  cartaoId: string,
  mesIdx: number,
  diaFechamento = 31
): number {
  return gastos
    .filter((g) => g.cartaoId === cartaoId && mesInvoiceGasto(g.data, diaFechamento) === mesIdx)
    .reduce((acc, g) => acc + g.valor, 0);
}

/** Total de assinaturas ativas de um cartão num mês */
export function totalAssinaturasCartaoMes(
  assinaturas: Assinatura[],
  cartaoId: string,
  mesIdx: number
): number {
  return assinaturas
    .filter((a) =>
      a.cartaoId === cartaoId &&
      a.ativa &&
      a.mesInicio <= mesIdx &&
      (a.mesFim === undefined || a.mesFim >= mesIdx)
    )
    .reduce((acc, a) => acc + a.valor, 0);
}

/** Fatura total estimada de um cartão num mês */
export function faturaCartaoMes(
  parcelamentos: Parcelamento[],
  gastos: GastoVariavel[],
  cartaoId: string,
  mesIdx: number,
  diaFechamento = 31,
  assinaturas: Assinatura[] = []
): number {
  return (
    totalParcelasCartaoMes(parcelamentos, cartaoId, mesIdx) +
    totalVariaveisCartaoMes(gastos, cartaoId, mesIdx, diaFechamento) +
    totalAssinaturasCartaoMes(assinaturas, cartaoId, mesIdx)
  );
}

/**
 * Saldo cumulativo de uma conta até o mês indicado (inclusive).
 * = saldo inicial + entradas - gastos variáveis débito/pix - gastos fixos pagos desta conta
 */
export function saldoConta(
  conta: Conta,
  entradas: Entrada[],
  gastos: GastoVariavel[],
  linhasFixas: LinhaFinanceira[],
  reservas: Reserva[],
  ateMesIdx: number
): number {
  let saldo = conta.saldoInicial;

  for (let i = 0; i <= ateMesIdx; i++) {
    const mes = MESES_KEYS[i];

    // + entradas recebidas nessa conta no mês i
    saldo += entradas
      .filter((e) => e.contaId === conta.id && mesDate(e.data) === i)
      .reduce((acc, e) => acc + e.valor, 0);

    // - gastos variáveis débito/pix dessa conta no mês i
    saldo -= gastos
      .filter((g) =>
        g.contaId === conta.id &&
        (g.meio === "debito" || g.meio === "pix") &&
        mesDate(g.data) === i
      )
      .reduce((acc, g) => acc + g.valor, 0);

    // - gastos fixos pagos desta conta no mês i
    saldo -= linhasFixas
      .filter((l) =>
        l.tipo === "gasto" &&
        l.pagos[mes] &&
        l.pagosContas[mes] === conta.id &&
        (l.valores[mes] ?? 0) > 0
      )
      .reduce((acc, l) => acc + (l.valores[mes] ?? 0), 0);

    // - aportes em reservas que saíram desta conta no mês i
    saldo -= reservas
      .filter((r) => r.aportesContas?.[mes] === conta.id)
      .reduce((acc, r) => acc + (r.aportes[mes] ?? 0), 0);
  }

  return saldo;
}

/** Quanto ainda pode ser gasto no crédito sem estourar o net do próximo mês */
export function limiteDisponivel(
  faturaAtual: number,
  netProximoMes: number
): number {
  return Math.max(0, netProximoMes - faturaAtual);
}
