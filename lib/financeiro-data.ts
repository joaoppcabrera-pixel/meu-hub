export const MESES = [
  "jan./26", "fev./26", "mar./26", "abr./26", "mai./26", "jun./26",
  "jul./26", "ago./26", "set./26", "out./26", "nov./26", "dez./26",
];

export const MESES_KEYS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export const MESES_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Retorna o mês (0-11) de uma string de data "YYYY-MM-DD" sem problemas de fuso.
 * new Date("2026-06-01") interpreta como UTC e pode virar maio no BR (UTC-3).
 * Forçar T12:00:00 garante que o parse seja no horário local.
 */
export function mesDate(data: string): number {
  return new Date(data + "T12:00:00").getMonth();
}

export const CATEGORIAS_PADRAO = [
  "Moradia", "Impostos", "Saúde", "Serviços", "Cartões", "Dívidas", "Investimentos", "Outros",
];

export type ValoresMensais = Record<string, number>;
export type PagosMensais = Record<string, boolean>;

export interface LinhaFinanceira {
  id: string;
  nome: string;
  tipo: "entrada" | "gasto";
  categoria?: string;
  diaVencimento?: number;
  valores: ValoresMensais;
  pagos: PagosMensais;
  pagosContas: Record<string, string>; // mes → contaId que pagou
  cartaoVinculadoId?: string; // se definido, valores são calculados automaticamente da fatura
}

export interface Parcela {
  id: string;
  nome: string;
  linhaId: string; // qual linha de gasto pertence
  valorParcela: number;
  mesInicio: number; // 0 = jan
  totalParcelas: number;
  parcelaAtual: number;
}

// --- Dados iniciais baseados na planilha ---

export const linhasIniciais: LinhaFinanceira[] = [
  // GASTOS
  {
    id: "aluguel",
    nome: "Aluguel apto",
    tipo: "gasto",
    categoria: "Moradia",
    valores: { jan: 3000, fev: 3000, mar: 3000, abr: 3500, mai: 3000, jun: 3500, jul: 4000, ago: 4000, set: 4000, out: 4000, nov: 4000, dez: 4000 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "iptu",
    nome: "IPTU",
    tipo: "gasto",
    categoria: "Moradia",
    valores: { jan: 0, fev: 165.96, mar: 165.96, abr: 165.96, mai: 165.96, jun: 165.96, jul: 165.96, ago: 165.96, set: 165.96, out: 165.96, nov: 165.96, dez: 0 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "faxina",
    nome: "Faxina",
    tipo: "gasto",
    categoria: "Moradia",
    valores: { jan: 1000, fev: 1300, mar: 1000, abr: 1000, mai: 1000, jun: 1000, jul: 1000, ago: 1000, set: 1000, out: 1000, nov: 1000, dez: 1000 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "imposto",
    nome: "Imposto",
    tipo: "gasto",
    categoria: "Impostos",
    valores: { jan: 309.01, fev: 1212.10, mar: 1209.01, abr: 1209.01, mai: 1209.01, jun: 1209.01, jul: 1209.01, ago: 1209.01, set: 1209.01, out: 1209.01, nov: 1209.01, dez: 1209.01 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "contador",
    nome: "Contador",
    tipo: "gasto",
    categoria: "Serviços",
    valores: { jan: 432, fev: 452, mar: 384.32, abr: 432, mai: 432, jun: 432, jul: 432, ago: 432, set: 432, out: 432, nov: 432, dez: 432 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "terapia",
    nome: "Terapia",
    tipo: "gasto",
    categoria: "Saúde",
    valores: { jan: 1000, fev: 1000, mar: 1000, abr: 1000, mai: 1000, jun: 1000, jul: 800, ago: 800, set: 800, out: 800, nov: 800, dez: 800 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "plano-saude",
    nome: "Plano de Saúde",
    tipo: "gasto",
    categoria: "Saúde",
    valores: { jan: 0, fev: 574, mar: 574, abr: 0, mai: 574, jun: 574, jul: 574, ago: 574, set: 574, out: 574, nov: 574, dez: 574 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "santander",
    nome: "Cartão Santander",
    tipo: "gasto",
    categoria: "Cartões",
    valores: { jan: 3422.49, fev: 3600, mar: 2850, abr: 5800, mai: 8000, jun: 1927.13, jul: 1881.14, ago: 1881.14, set: 1829.48, out: 1829.48, nov: 715.19, dez: 715.19 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "c6",
    nome: "Cartão C6",
    tipo: "gasto",
    categoria: "Cartões",
    valores: { jan: 600, fev: 345.60, mar: 694.29, abr: 0, mai: 0, jun: 350, jul: 350, ago: 350, set: 350, out: 350, nov: 350, dez: 350 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "emprestimo",
    nome: "Empréstimo",
    tipo: "gasto",
    categoria: "Dívidas",
    valores: { jan: 2452.69, fev: 197.58, mar: 197.58, abr: 687, mai: 705.58, jun: 687, jul: 500, ago: 500, set: 500, out: 500, nov: 500, dez: 500 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "seguro-cel",
    nome: "Seguro celular",
    tipo: "gasto",
    categoria: "Serviços",
    valores: { jan: 0, fev: 69.53, mar: 69.53, abr: 69.53, mai: 69.53, jun: 69.53, jul: 69.53, ago: 69.53, set: 69.53, out: 69.53, nov: 69.53, dez: 69.53 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "celular",
    nome: "Celular",
    tipo: "gasto",
    categoria: "Serviços",
    valores: { jan: 0, fev: 0, mar: 511, abr: 511, mai: 511, jun: 511, jul: 511, ago: 511, set: 511, out: 511, nov: 511, dez: 511 },
    pagos: {}, pagosContas: {},
  },
  {
    id: "aplicacao",
    nome: "Aplicação",
    tipo: "gasto",
    categoria: "Investimentos",
    valores: { jan: 0, fev: 0, mar: 1363.78, abr: 0, mai: 0, jun: 1500, jul: 1500, ago: 1500, set: 1500, out: 1500, nov: 2500, dez: 3000 },
    pagos: {}, pagosContas: {},
  },
];

export function calcularTotalMes(linhas: LinhaFinanceira[], tipo: "entrada" | "gasto", mes: string): number {
  return linhas
    .filter((l) => l.tipo === tipo)
    .reduce((acc, l) => acc + (l.valores[mes] ?? 0), 0);
}

export function calcularNet(linhas: LinhaFinanceira[], mes: string): number {
  return calcularTotalMes(linhas, "entrada", mes) - calcularTotalMes(linhas, "gasto", mes);
}

export function calcularReservaAcumulada(linhas: LinhaFinanceira[]): Record<string, number> {
  let acumulado = 0;
  const reserva: Record<string, number> = {};
  for (const mes of MESES_KEYS) {
    acumulado += calcularNet(linhas, mes);
    reserva[mes] = acumulado;
  }
  return reserva;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
