export interface Banco {
  id: string;
  nome: string;
  sigla: string;
  bg: string;       // Tailwind bg class
  text: string;     // Tailwind text class
}

export const BANCOS: Banco[] = [
  { id: "nubank",      nome: "Nubank",           sigla: "Nu",  bg: "bg-purple-600",  text: "text-purple-400" },
  { id: "itau",        nome: "Itaú",             sigla: "Itá", bg: "bg-orange-600",  text: "text-orange-400" },
  { id: "bradesco",    nome: "Bradesco",          sigla: "Bra", bg: "bg-red-600",     text: "text-red-400"    },
  { id: "santander",   nome: "Santander",         sigla: "San", bg: "bg-red-500",     text: "text-red-400"    },
  { id: "bb",          nome: "Banco do Brasil",   sigla: "BB",  bg: "bg-yellow-500",  text: "text-yellow-400" },
  { id: "caixa",       nome: "Caixa",             sigla: "Cx",  bg: "bg-blue-600",    text: "text-blue-400"   },
  { id: "inter",       nome: "Inter",             sigla: "Int", bg: "bg-orange-500",  text: "text-orange-400" },
  { id: "c6",          nome: "C6 Bank",           sigla: "C6",  bg: "bg-zinc-600",    text: "text-zinc-400"   },
  { id: "xp",          nome: "XP",                sigla: "XP",  bg: "bg-gray-800",    text: "text-gray-300"   },
  { id: "btg",         nome: "BTG Pactual",       sigla: "BTG", bg: "bg-indigo-800",  text: "text-indigo-400" },
  { id: "original",    nome: "Original",          sigla: "Or",  bg: "bg-green-700",   text: "text-green-400"  },
  { id: "sicoob",      nome: "Sicoob",            sigla: "Si",  bg: "bg-emerald-700", text: "text-emerald-400"},
  { id: "picpay",      nome: "PicPay",            sigla: "PP",  bg: "bg-green-500",   text: "text-green-400"  },
  { id: "mercadopago", nome: "Mercado Pago",      sigla: "MP",  bg: "bg-sky-500",     text: "text-sky-400"    },
  { id: "pagseguro",   nome: "PagSeguro",         sigla: "Pag", bg: "bg-yellow-600",  text: "text-yellow-400" },
  { id: "outro",       nome: "Outro",             sigla: "??",  bg: "bg-gray-600",    text: "text-gray-400"   },
];

export function getBanco(id: string): Banco {
  return BANCOS.find((b) => b.id === id) ?? BANCOS[BANCOS.length - 1];
}
