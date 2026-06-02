import { MESES_KEYS } from "./financeiro-data";

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
  aportes: Record<string, number>; // "jun" -> valor aportado
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

/** Total de gastos variáveis de um cartão num mês */
export function totalVariaveisCartaoMes(gastos: GastoVariavel[], cartaoId: string, mesIdx: number): number {
  return gastos
    .filter((g) => g.cartaoId === cartaoId && new Date(g.data).getMonth() === mesIdx)
    .reduce((acc, g) => acc + g.valor, 0);
}

/** Fatura total estimada de um cartão num mês */
export function faturaCartaoMes(
  parcelamentos: Parcelamento[],
  gastos: GastoVariavel[],
  cartaoId: string,
  mesIdx: number
): number {
  return (
    totalParcelasCartaoMes(parcelamentos, cartaoId, mesIdx) +
    totalVariaveisCartaoMes(gastos, cartaoId, mesIdx)
  );
}

/**
 * Saldo cumulativo de uma conta até o mês indicado (inclusive).
 * = saldo inicial + todas as entradas até o mês - todos os débitos até o mês
 */
export function saldoConta(
  conta: Conta,
  entradas: Entrada[],
  gastos: GastoVariavel[],
  ateMesIdx: number
): number {
  let saldo = conta.saldoInicial;

  for (let i = 0; i <= ateMesIdx; i++) {
    // + entradas recebidas nessa conta no mês i
    saldo += entradas
      .filter((e) => e.contaId === conta.id && new Date(e.data).getMonth() === i)
      .reduce((acc, e) => acc + e.valor, 0);

    // - gastos variáveis débito/pix dessa conta no mês i
    saldo -= gastos
      .filter((g) =>
        g.contaId === conta.id &&
        (g.meio === "debito" || g.meio === "pix") &&
        new Date(g.data).getMonth() === i
      )
      .reduce((acc, g) => acc + g.valor, 0);
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
