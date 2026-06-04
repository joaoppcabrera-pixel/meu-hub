import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
export async function GET() {
  return NextResponse.json({ name: "meu-hub", version: "2.0.0" }, { headers: CORS });
}

// ── AUTH ──────────────────────────────────────────────────

async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const fromHeader = auth.replace(/^Bearer\s+/i, "").trim();
  const fromQuery = req.nextUrl.searchParams.get("key") ?? "";
  const key = fromHeader || fromQuery;
  if (!key) return null;
  const { data } = await supabase.from("user_api_keys").select("user_id").eq("key", key).single();
  return data?.user_id ?? null;
}

// ── HELPERS ───────────────────────────────────────────────

function hoje() { return new Date().toISOString().split("T")[0]; }
function mesAtual() { return new Date().getMonth(); }
const MESES_KEYS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const MESES_LABELS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function fmtBRL(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }
const MEIOS: Record<string,string> = { debito:"Débito", credito:"Crédito", pix:"Pix", dinheiro:"Dinheiro", va:"Vale Alimentação" };

// ── CATEGORIA INFERENCE ───────────────────────────────────

const CATEGORIA_KW: Record<string, string[]> = {
  "Alimentação": ["almoço","almoco","janta","jantar","café","cafe","lanche","padaria","mercado","supermercado","restaurante","ifood","rappi","delivery","pizza","sushi","hamburguer","comida","refeição","sorvete","bar","boteco","churrasco","açaí","acai","sanduíche","pão"],
  "Transporte": ["uber","99","cabify","taxi","ônibus","onibus","metro","trem","combustível","gasolina","etanol","diesel","posto","estacionamento","pedágio","passagem","moto","scooter","patinete"],
  "Saúde": ["farmácia","farmacia","remédio","remedio","medicamento","médico","medico","consulta","hospital","clínica","exame","laboratório","dentista","fisioterapia","academia","suplemento","vitamina"],
  "Lazer": ["cinema","filme","teatro","show","ingresso","netflix","spotify","amazon prime","disney","hbo","jogo","game","steam","viagem","hotel","airbnb","passeio","parque","museu"],
  "Serviços": ["internet","telefone","assinatura","mensalidade","streaming","apple","google","icloud","adobe","dropbox","manutenção","lavanderia","cabeleireiro","barbearia","salão","manicure","veterinário"],
  "Moradia": ["aluguel","condomínio","iptu","limpeza","faxina","reforma","móvel","decoração"],
  "Compras": ["roupa","sapato","tênis","calçado","loja","shopping","amazon","mercado livre","shopee","americanas","magazine","eletrônico","celular","notebook","presente","perfume","cosméticos"],
  "Educação": ["escola","faculdade","curso","aula","livro","material escolar","udemy","alura","duolingo","inglês","espanhol","idioma","certificado"],
};
function inferirCategoria(desc: string, cats: {nome:string}[]): string {
  const t = desc.toLowerCase();
  for (const [base, kws] of Object.entries(CATEGORIA_KW)) {
    if (kws.some(k => t.includes(k))) {
      const m = cats.find(c => c.nome.toLowerCase().includes(base.slice(0,5).toLowerCase()));
      if (m) return m.nome;
    }
  }
  return cats[0]?.nome ?? "Outros";
}

// ── TOOLS DEFINITION ─────────────────────────────────────

const TOOLS = [
  {
    name: "registrar_gasto",
    description: `Registra um gasto variável. Use para: "gastei 45 no almoço", "paguei 120 de Uber no crédito", "50 reais no mercado no débito".`,
    inputSchema: {
      type: "object",
      properties: {
        descricao:       { type: "string",  description: "O que foi comprado/pago" },
        valor:           { type: "number",  description: "Valor em reais" },
        categoria:       { type: "string",  description: "Categoria (opcional, será inferida)" },
        meio:            { type: "string",  enum: ["debito","credito","pix","dinheiro","va"] },
        conta_ou_cartao: { type: "string",  description: "Nome da conta ou cartão" },
        data:            { type: "string",  description: "Data YYYY-MM-DD. Padrão: hoje" },
      },
      required: ["descricao","valor"],
    },
  },
  {
    name: "registrar_entrada",
    description: `Registra uma receita/entrada de dinheiro. Use para: "recebi meu salário", "entrou 500 de freela".`,
    inputSchema: {
      type: "object",
      properties: {
        descricao: { type: "string",  description: "Descrição da entrada" },
        valor:     { type: "number",  description: "Valor em reais" },
        categoria: { type: "string",  description: "Categoria (Salário, Freelance, etc.)" },
        conta:     { type: "string",  description: "Nome da conta que recebeu" },
        data:      { type: "string",  description: "Data YYYY-MM-DD. Padrão: hoje" },
      },
      required: ["descricao","valor"],
    },
  },
  {
    name: "resumo_financeiro",
    description: `Retorna um resumo completo da situação financeira atual: saldo em conta, gastos do mês, faturas dos cartões, entradas, reservas e próximas contas a pagar. Use quando o usuário perguntar "como estão minhas finanças?", "qual meu saldo?", "quanto gastei este mês?".`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_gastos_recentes",
    description: "Lista os gastos variáveis. Pode filtrar por conta/cartão específico (ex: 'Caju', 'Santander', 'C6').",
    inputSchema: {
      type: "object",
      properties: {
        limite: { type: "number", description: "Quantidade (padrão: 10)" },
        mes:    { type: "number", description: "Mês 0-11 (padrão: mês atual)" },
        conta:  { type: "string", description: "Filtrar por nome da conta ou cartão (ex: Caju, Santander, C6)" },
      },
    },
  },
  {
    name: "listar_gastos_fixos",
    description: "Lista os gastos fixos do mês atual com status de pagamento.",
    inputSchema: {
      type: "object",
      properties: {
        mes: { type: "number", description: "Mês 0-11 (padrão: mês atual)" },
      },
    },
  },
  {
    name: "listar_entradas",
    description: "Lista as entradas/receitas registradas.",
    inputSchema: {
      type: "object",
      properties: {
        mes:    { type: "number", description: "Mês 0-11 (padrão: mês atual)" },
        limite: { type: "number", description: "Quantidade (padrão: 10)" },
      },
    },
  },
  {
    name: "listar_parcelamentos",
    description: "Lista os parcelamentos ativos no cartão de crédito.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_reservas",
    description: "Lista reservas e investimentos com saldos e metas.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_assinaturas",
    description: "Lista as assinaturas recorrentes no cartão de crédito.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_contas_e_cartoes",
    description: "Lista todas as contas bancárias e cartões cadastrados.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "detalhe_conta",
    description: "Mostra o extrato detalhado de uma conta específica: saldo inicial, todas as entradas e todos os débitos vinculados a ela.",
    inputSchema: {
      type: "object",
      properties: {
        conta: { type: "string", description: "Nome da conta (ex: Caju, Santander)" },
      },
      required: ["conta"],
    },
  },
  {
    name: "listar_categorias",
    description: "Lista as categorias de despesas disponíveis.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ── TOOL HANDLERS ─────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>, userId: string): Promise<string> {

  // ── registrar_gasto ──────────────────────────────────
  if (name === "registrar_gasto") {
    const [{ data: contas }, { data: cats }] = await Promise.all([
      supabase.from("contas_bancarias").select("*").eq("user_id", userId),
      supabase.from("categorias").select("*").eq("user_id", userId),
    ]);
    const meio = (args.meio as string) || "debito";
    const data = (args.data as string) || hoje();
    const busca = ((args.conta_ou_cartao as string) || "").toLowerCase();
    let cartaoId = null, contaId = null, contaLabel = "";
    if (contas?.length) {
      if (meio === "credito") {
        const cartoes = contas.filter(c => c.tipo === "cartao");
        const c = busca ? cartoes.find(x => x.nome.toLowerCase().includes(busca)) ?? cartoes[0] : cartoes[0];
        if (c) { cartaoId = c.id; contaLabel = c.nome; }
      } else if (meio === "debito" || meio === "pix") {
        const correntes = contas.filter(c => c.tipo === "corrente");
        const c = busca ? correntes.find(x => x.nome.toLowerCase().includes(busca)) ?? correntes[0] : correntes[0];
        if (c) { contaId = c.id; contaLabel = c.nome; }
      }
    }
    let categoria = (args.categoria as string) || null;
    if (categoria && cats?.length) {
      const m = cats.find(c => c.nome.toLowerCase().includes(categoria!.toLowerCase()));
      categoria = m ? m.nome : categoria;
    }
    if (!categoria) categoria = inferirCategoria(args.descricao as string, cats ?? []);
    const { error } = await supabase.from("gastos_variaveis").insert({
      id: `gv-mcp-${Date.now()}`, descricao: args.descricao, valor: args.valor,
      data, categoria, meio, cartao_id: cartaoId, conta_id: contaId, user_id: userId,
    });
    if (error) throw new Error(error.message);
    const d = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"short", day:"numeric", month:"short" });
    return `✅ Gasto registrado!\n\n📝 ${args.descricao}\n💰 ${fmtBRL(args.valor as number)}\n🏷️  ${categoria}\n💳 ${MEIOS[meio]}${contaLabel ? ` · ${contaLabel}` : ""}\n📅 ${d}`;
  }

  // ── registrar_entrada ────────────────────────────────
  if (name === "registrar_entrada") {
    const { data: contas } = await supabase.from("contas_bancarias").select("*").eq("user_id", userId).eq("tipo","corrente");
    const busca = ((args.conta as string) || "").toLowerCase();
    const conta = busca ? contas?.find(c => c.nome.toLowerCase().includes(busca)) ?? contas?.[0] : contas?.[0];
    const CATS_ENTRADA = ["Salário","Freelance","Renda Extra","Dividendos","Aluguel Recebido","Bônus","Outros"];
    const catStr = (args.categoria as string) || "";
    const categoria = CATS_ENTRADA.find(c => c.toLowerCase().includes(catStr.toLowerCase())) ?? "Outros";
    const data = (args.data as string) || hoje();
    const { error } = await supabase.from("entradas").insert({
      id: `ent-mcp-${Date.now()}`, descricao: args.descricao, valor: args.valor,
      data, categoria, conta_id: conta?.id ?? null, user_id: userId,
    });
    if (error) throw new Error(error.message);
    return `✅ Entrada registrada!\n\n📝 ${args.descricao}\n💰 +${fmtBRL(args.valor as number)}\n🏷️  ${categoria}${conta ? `\n🏦 ${conta.nome}` : ""}`;
  }

  // ── resumo_financeiro ────────────────────────────────
  if (name === "resumo_financeiro") {
    const mesIdx = mesAtual();
    const mesKey = MESES_KEYS[mesIdx];
    const mesLabel = MESES_LABELS[mesIdx];

    const [
      { data: contas }, { data: linhas }, { data: entradas },
      { data: gastos }, { data: parcelamentos }, { data: reservas }, { data: assinaturas }
    ] = await Promise.all([
      supabase.from("contas_bancarias").select("*").eq("user_id", userId),
      supabase.from("linhas_fixas").select("*").eq("user_id", userId),
      supabase.from("entradas").select("*").eq("user_id", userId),
      supabase.from("gastos_variaveis").select("*").eq("user_id", userId),
      supabase.from("parcelamentos").select("*").eq("user_id", userId),
      supabase.from("reservas").select("*").eq("user_id", userId),
      supabase.from("assinaturas").select("*").eq("user_id", userId).eq("ativa", true),
    ]);

    // Gastos variáveis do mês
    const gastosVarMes = (gastos ?? []).filter(g => new Date(g.data + "T12:00:00").getMonth() === mesIdx);
    const totalVarMes = gastosVarMes.reduce((a, g) => a + Number(g.valor), 0);

    // Entradas do mês
    const entradasMes = (entradas ?? []).filter(e => new Date(e.data + "T12:00:00").getMonth() === mesIdx);
    const totalEntradasMes = entradasMes.reduce((a, e) => a + Number(e.valor), 0);

    // Gastos fixos
    const fixosMes = (linhas ?? []).filter(l => (l.valores?.[mesKey] ?? 0) > 0);
    const totalFixos = fixosMes.reduce((a, l) => a + (l.valores?.[mesKey] ?? 0), 0);
    const totalFixosPagos = fixosMes.filter(l => l.pagos?.[mesKey]).reduce((a, l) => a + (l.valores?.[mesKey] ?? 0), 0);
    const fixosPendentes = fixosMes.filter(l => !l.pagos?.[mesKey]);

    // Saldo por conta corrente (cumulativo — soma todas as entradas e subtrai todos os débitos históricos)
    const saldosPorConta = (contas ?? [])
      .filter(c => c.tipo === "corrente")
      .map(c => {
        const totalEntradas = (entradas ?? [])
          .filter(e => e.conta_id === c.id)
          .reduce((a, e) => a + Number(e.valor), 0);
        const totalDebitos = (gastos ?? [])
          .filter(g => g.conta_id === c.id && (g.meio === "debito" || g.meio === "pix"))
          .reduce((a, g) => a + Number(g.valor), 0);
        const saldo = Number(c.saldo_inicial ?? 0) + totalEntradas - totalDebitos;
        return { nome: c.nome, saldo, totalEntradas, totalDebitos, saldoInicial: Number(c.saldo_inicial ?? 0) };
      });
    const saldoTotal = saldosPorConta.reduce((a, c) => a + c.saldo, 0);

    // Faturas dos cartões
    const cartoes = (contas ?? []).filter(c => c.tipo === "cartao");
    const faturasPorCartao = cartoes.map(c => {
      const totalParcelas = (parcelamentos ?? [])
        .filter(p => p.cartao_id === c.id && p.mes_inicio <= mesIdx && p.mes_inicio + p.total_parcelas - 1 >= mesIdx)
        .reduce((a, p) => a + Number(p.valor_parcela), 0);
      const totalVarCard = (gastos ?? [])
        .filter(g => g.cartao_id === c.id && new Date(g.data + "T12:00:00").getMonth() === mesIdx)
        .reduce((a, g) => a + Number(g.valor), 0);
      const totalAss = (assinaturas ?? [])
        .filter(a => a.cartao_id === c.id && a.mes_inicio <= mesIdx)
        .reduce((a, s) => a + Number(s.valor), 0);
      return { nome: c.nome, total: totalParcelas + totalVarCard + totalAss };
    });
    const totalFaturas = faturasPorCartao.reduce((a, f) => a + f.total, 0);

    // Reservas
    const totalReservado = (reservas ?? []).reduce((a, r) => a + Number(r.saldo_atual), 0);

    // Top categorias gastos variáveis
    const porCat: Record<string, number> = {};
    gastosVarMes.forEach(g => { porCat[g.categoria] = (porCat[g.categoria] ?? 0) + Number(g.valor); });
    const topCats = Object.entries(porCat).sort((a,b) => b[1]-a[1]).slice(0,3);

    const linhas_saida: string[] = [
      `📊 Resumo Financeiro — ${mesLabel}`,
      ``,
      `💰 SALDO EM CONTA`,
      `  Total: ${fmtBRL(saldoTotal)}`,
      ...saldosPorConta.map(c =>
        `  ${c.nome}: ${fmtBRL(c.saldo)} (inicial ${fmtBRL(c.saldoInicial)} + entradas ${fmtBRL(c.totalEntradas)} - débitos ${fmtBRL(c.totalDebitos)})`
      ),
      ``,
      `📥 ENTRADAS DO MÊS`,
      `  Total recebido: ${fmtBRL(totalEntradasMes)}`,
      entradasMes.length === 0 ? `  Nenhuma entrada registrada` : `  ${entradasMes.length} lançamento(s)`,
      ``,
      `📌 GASTOS FIXOS`,
      `  Total: ${fmtBRL(totalFixos)}`,
      `  Pagos: ${fmtBRL(totalFixosPagos)} (${totalFixos > 0 ? ((totalFixosPagos/totalFixos)*100).toFixed(0) : 0}%)`,
      `  Pendentes: ${fixosPendentes.length} conta(s)`,
      fixosPendentes.length > 0 ? `  Próximas: ${fixosPendentes.slice(0,3).map(l => `${l.nome} (${fmtBRL(l.valores?.[mesKey] ?? 0)})`).join(", ")}` : "",
      ``,
      `💳 FATURAS DOS CARTÕES`,
      `  Total estimado: ${fmtBRL(totalFaturas)}`,
      ...faturasPorCartao.map(f => `  ${f.nome}: ${fmtBRL(f.total)}`),
      ``,
      `💸 GASTOS VARIÁVEIS`,
      `  Total: ${fmtBRL(totalVarMes)} em ${gastosVarMes.length} lançamento(s)`,
      topCats.length > 0 ? `  Top categorias: ${topCats.map(([c,v]) => `${c} ${fmtBRL(v)}`).join(" · ")}` : "",
      ``,
      `🏦 RESERVAS`,
      `  Total guardado: ${fmtBRL(totalReservado)}`,
      (reservas ?? []).length > 0 ? `  ${(reservas ?? []).map(r => `${r.nome}: ${fmtBRL(Number(r.saldo_atual))}`).join(" · ")}` : "  Nenhuma reserva cadastrada",
    ];

    return linhas_saida.filter(l => l !== "").join("\n");
  }

  // ── listar_gastos_recentes ───────────────────────────
  if (name === "listar_gastos_recentes") {
    const limite = (args.limite as number) || 10;
    const mesIdx = args.mes !== undefined ? (args.mes as number) : mesAtual();
    const filtroConta = ((args.conta as string) || "").toLowerCase();

    const [{ data }, { data: contas }, { data: cartoes }] = await Promise.all([
      supabase.from("gastos_variaveis").select("*").eq("user_id", userId).order("data", { ascending: false }).limit(200),
      supabase.from("contas_bancarias").select("id,nome").eq("user_id", userId).eq("tipo","corrente"),
      supabase.from("contas_bancarias").select("id,nome").eq("user_id", userId).eq("tipo","cartao"),
    ]);

    let filtrado = (data ?? []).filter(g => new Date(g.data + "T12:00:00").getMonth() === mesIdx);

    // Filtrar por conta se especificado
    if (filtroConta) {
      const contaMatch = [...(contas ?? []), ...(cartoes ?? [])].find(c => c.nome.toLowerCase().includes(filtroConta));
      if (contaMatch) {
        filtrado = filtrado.filter(g => g.conta_id === contaMatch.id || g.cartao_id === contaMatch.id);
      }
    }

    filtrado = filtrado.slice(0, limite);
    if (!filtrado.length) return `Nenhum gasto${filtroConta ? ` na conta ${filtroConta}` : ""} em ${MESES_LABELS[mesIdx]}.`;

    const total = filtrado.reduce((a, g) => a + Number(g.valor), 0);
    const lista = filtrado.map(g => {
      const d = new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
      const contaNome = (contas ?? []).find(c => c.id === g.conta_id)?.nome
        ?? (cartoes ?? []).find(c => c.id === g.cartao_id)?.nome ?? "";
      return `• ${d} · ${g.descricao} — ${fmtBRL(g.valor)} · ${g.categoria} · ${MEIOS[g.meio] ?? g.meio}${contaNome ? ` · ${contaNome}` : ""}`;
    }).join("\n");

    return `Gastos de ${MESES_LABELS[mesIdx]}${filtroConta ? ` (${filtroConta})` : ""} — ${filtrado.length} lançamentos · total ${fmtBRL(total)}:\n\n${lista}`;
  }

  // ── listar_gastos_fixos ──────────────────────────────
  if (name === "listar_gastos_fixos") {
    const mesIdx = args.mes !== undefined ? (args.mes as number) : mesAtual();
    const mesKey = MESES_KEYS[mesIdx];
    const { data } = await supabase.from("linhas_fixas").select("*").eq("user_id", userId);
    const fixos = (data ?? []).filter(l => (l.valores?.[mesKey] ?? 0) > 0);
    if (!fixos.length) return `Nenhum gasto fixo em ${MESES_LABELS[mesIdx]}.`;
    const total = fixos.reduce((a, l) => a + (l.valores?.[mesKey] ?? 0), 0);
    const pagos = fixos.filter(l => l.pagos?.[mesKey]);
    const lista = fixos.map(l => {
      const status = l.pagos?.[mesKey] ? "✅" : "⏳";
      const venc = l.dia_vencimento ? ` · vence dia ${l.dia_vencimento}` : "";
      return `${status} ${l.nome}${venc} — ${fmtBRL(l.valores?.[mesKey] ?? 0)}`;
    }).join("\n");
    return `Gastos fixos de ${MESES_LABELS[mesIdx]}:\n\nTotal: ${fmtBRL(total)} · ${pagos.length}/${fixos.length} pagos\n\n${lista}`;
  }

  // ── listar_entradas ──────────────────────────────────
  if (name === "listar_entradas") {
    const mesIdx = args.mes !== undefined ? (args.mes as number) : mesAtual();
    const limite = (args.limite as number) || 10;
    const { data } = await supabase.from("entradas").select("*").eq("user_id", userId).order("data", { ascending: false }).limit(50);
    const filtrado = (data ?? []).filter(e => new Date(e.data + "T12:00:00").getMonth() === mesIdx).slice(0, limite);
    if (!filtrado.length) return `Nenhuma entrada em ${MESES_LABELS[mesIdx]}.`;
    const total = filtrado.reduce((a, e) => a + Number(e.valor), 0);
    const lista = filtrado.map(e => {
      const d = new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
      return `• ${d} · ${e.descricao} — +${fmtBRL(e.valor)} · ${e.categoria}`;
    }).join("\n");
    return `Entradas de ${MESES_LABELS[mesIdx]} (total +${fmtBRL(total)}):\n\n${lista}`;
  }

  // ── listar_parcelamentos ─────────────────────────────
  if (name === "listar_parcelamentos") {
    const { data: parcs } = await supabase.from("parcelamentos").select("*").eq("user_id", userId);
    const { data: contas } = await supabase.from("contas_bancarias").select("id,nome").eq("user_id", userId);
    const mesIdx = mesAtual();
    const ativos = (parcs ?? []).filter(p => p.mes_inicio + p.total_parcelas - 1 >= mesIdx);
    if (!ativos.length) return "Nenhum parcelamento ativo.";
    const total = ativos.reduce((a, p) => a + Number(p.valor_parcela), 0);
    const lista = ativos.map(p => {
      const cartao = contas?.find(c => c.id === p.cartao_id)?.nome ?? "Cartão";
      const parcelaAtual = mesIdx - p.mes_inicio + 1;
      const restantes = p.total_parcelas - parcelaAtual + 1;
      return `• ${p.descricao} — ${fmtBRL(p.valor_parcela)}/mês · ${parcelaAtual}/${p.total_parcelas} · ${restantes}x restantes · ${cartao}`;
    }).join("\n");
    return `Parcelamentos ativos (${ativos.length} · ${fmtBRL(total)}/mês):\n\n${lista}`;
  }

  // ── listar_reservas ──────────────────────────────────
  if (name === "listar_reservas") {
    const { data } = await supabase.from("reservas").select("*").eq("user_id", userId).order("saldo_atual", { ascending: false });
    if (!data?.length) return "Nenhuma reserva cadastrada.";
    const total = data.reduce((a, r) => a + Number(r.saldo_atual), 0);
    const lista = data.map(r => {
      const meta = r.meta ? ` · meta ${fmtBRL(Number(r.meta))} (${((Number(r.saldo_atual)/Number(r.meta))*100).toFixed(0)}%)` : "";
      return `• ${r.nome} — ${fmtBRL(Number(r.saldo_atual))}${meta}`;
    }).join("\n");
    return `Reservas e investimentos (total: ${fmtBRL(total)}):\n\n${lista}`;
  }

  // ── listar_assinaturas ───────────────────────────────
  if (name === "listar_assinaturas") {
    const { data } = await supabase.from("assinaturas").select("*").eq("user_id", userId).order("valor", { ascending: false });
    const ativas = (data ?? []).filter(a => a.ativa);
    const canceladas = (data ?? []).filter(a => !a.ativa);
    if (!data?.length) return "Nenhuma assinatura cadastrada.";
    const totalMes = ativas.reduce((a, s) => a + Number(s.valor), 0);
    const listaAtivas = ativas.map(s => `• ${s.descricao} — ${fmtBRL(Number(s.valor))}/mês · Dia ${s.dia_cobranca} · ${s.categoria}`).join("\n");
    const listaCanceladas = canceladas.length > 0 ? `\n\nCanceladas:\n${canceladas.map(s => `• ~~${s.descricao}~~ — ${fmtBRL(Number(s.valor))}/mês`).join("\n")}` : "";
    return `Assinaturas ativas (${ativas.length} · ${fmtBRL(totalMes)}/mês):\n\n${listaAtivas}${listaCanceladas}`;
  }

  // ── detalhe_conta ────────────────────────────────────
  if (name === "detalhe_conta") {
    const busca = ((args.conta as string) || "").toLowerCase();
    const { data: contas } = await supabase.from("contas_bancarias").select("*").eq("user_id", userId);
    const conta = (contas ?? []).find(c => c.nome.toLowerCase().includes(busca));
    if (!conta) return `Conta "${args.conta}" não encontrada. Contas disponíveis: ${(contas ?? []).map(c => c.nome).join(", ")}`;

    const [{ data: entradasConta }, { data: gastosConta }] = await Promise.all([
      supabase.from("entradas").select("*").eq("conta_id", conta.id).order("data", { ascending: false }),
      supabase.from("gastos_variaveis").select("*").eq("conta_id", conta.id).order("data", { ascending: false }),
    ]);

    const totalEntradas = (entradasConta ?? []).reduce((a, e) => a + Number(e.valor), 0);
    const totalDebitos = (gastosConta ?? []).filter(g => g.meio === "debito" || g.meio === "pix").reduce((a, g) => a + Number(g.valor), 0);
    const saldo = Number(conta.saldo_inicial ?? 0) + totalEntradas - totalDebitos;

    const listaEntradas = (entradasConta ?? []).slice(0, 5).map(e => {
      const d = new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
      return `  + ${d} · ${e.descricao} · ${fmtBRL(e.valor)}`;
    }).join("\n");

    const listaDebitos = (gastosConta ?? []).slice(0, 5).map(g => {
      const d = new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
      return `  - ${d} · ${g.descricao} · ${fmtBRL(g.valor)}`;
    }).join("\n");

    return [
      `🏦 Extrato — ${conta.nome}`,
      `Saldo inicial: ${fmtBRL(Number(conta.saldo_inicial ?? 0))}`,
      ``,
      `📥 Entradas (${entradasConta?.length ?? 0} · total ${fmtBRL(totalEntradas)}):`,
      listaEntradas || "  Nenhuma entrada vinculada",
      ``,
      `📤 Débitos (${gastosConta?.length ?? 0} · total ${fmtBRL(totalDebitos)}):`,
      listaDebitos || "  Nenhum débito vinculado",
      ``,
      `💰 Saldo atual: ${fmtBRL(saldo)}`,
    ].join("\n");
  }

  // ── listar_contas_e_cartoes ──────────────────────────
  if (name === "listar_contas_e_cartoes") {
    const { data } = await supabase.from("contas_bancarias").select("*").eq("user_id", userId).order("created_at");
    if (!data?.length) return "Nenhuma conta cadastrada.";
    const tipos: Record<string,string> = { corrente:"Conta Corrente", cartao:"Cartão de Crédito", investimento:"Investimento" };
    return `Contas e cartões:\n\n${data.map(c => {
      const extra = c.tipo === "cartao" && c.limite ? ` · Limite ${fmtBRL(Number(c.limite))} · Fecha dia ${c.dia_fechamento}` : c.saldo_inicial ? ` · Saldo inicial ${fmtBRL(Number(c.saldo_inicial))}` : "";
      return `• ${c.nome} — ${tipos[c.tipo] || c.tipo}${extra}`;
    }).join("\n")}`;
  }

  // ── listar_categorias ────────────────────────────────
  if (name === "listar_categorias") {
    const { data } = await supabase.from("categorias").select("nome").eq("user_id", userId).order("nome");
    return `Categorias:\n\n${(data || []).map(c => `• ${c.nome}`).join("\n")}`;
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
}

// ── MAIN HANDLER ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json(
      { jsonrpc:"2.0", id:null, error:{ code:-32001, message:"Chave de API inválida ou ausente." } },
      { status:401, headers:CORS }
    );
  }

  const body = await req.json();
  const { method, params, id } = body;

  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc:"2.0", id,
      result: { protocolVersion:"2024-11-05", capabilities:{ tools:{} }, serverInfo:{ name:"meu-hub", version:"2.0.0" } },
    }, { headers:CORS });
  }

  if (method === "tools/list") {
    return NextResponse.json({ jsonrpc:"2.0", id, result:{ tools:TOOLS } }, { headers:CORS });
  }

  if (method === "tools/call") {
    try {
      const text = await callTool(params.name, params.arguments ?? {}, userId);
      return NextResponse.json({ jsonrpc:"2.0", id, result:{ content:[{ type:"text", text }] } }, { headers:CORS });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ jsonrpc:"2.0", id, error:{ code:-32000, message:msg } }, { status:500, headers:CORS });
    }
  }

  return NextResponse.json(
    { jsonrpc:"2.0", id, error:{ code:-32601, message:"Método não encontrado." } },
    { status:404, headers:CORS }
  );
}
