import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── CORS ──────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  return NextResponse.json(
    { name: "meu-hub", version: "1.0.0", description: "MCP do Meu Hub" },
    { headers: CORS }
  );
}

// ── AUTENTICAÇÃO POR API KEY ──────────────────────────────

async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.replace(/^Bearer\s+/i, "").trim();
  if (!key) return null;

  const { data } = await supabase
    .from("user_api_keys")
    .select("user_id")
    .eq("key", key)
    .single();

  return data?.user_id ?? null;
}

// ── INFERÊNCIA DE CATEGORIA ───────────────────────────────

const CATEGORIA_KEYWORDS: Record<string, string[]> = {
  "Alimentação": [
    "almoço","almoco","janta","jantar","café","cafe","lanche","padaria",
    "mercado","supermercado","açougue","restaurante","ifood","rappi",
    "uber eats","delivery","pizza","sushi","hamburguer","comida","refeição",
    "sorvete","bar","boteco","churrasco","açaí","acai","sanduíche","pão",
  ],
  "Transporte": [
    "uber","99","cabify","taxi","ônibus","onibus","metro","trem",
    "combustível","gasolina","etanol","diesel","posto","estacionamento",
    "pedágio","passagem","brt","moto","scooter","patinete",
  ],
  "Saúde": [
    "farmácia","farmacia","remédio","remedio","medicamento","médico","medico",
    "consulta","hospital","clínica","clinica","exame","laboratório","dentista",
    "fisioterapia","academia","suplemento","vitamina",
  ],
  "Lazer": [
    "cinema","filme","teatro","show","ingresso","netflix","spotify",
    "amazon prime","disney","hbo","jogo","game","steam","viagem",
    "hotel","airbnb","passeio","parque","museu",
  ],
  "Serviços": [
    "internet","telefone","assinatura","mensalidade","streaming","apple",
    "google","icloud","adobe","dropbox","manutenção","lavanderia",
    "cabeleireiro","barbearia","salão","manicure","pet shop","veterinário",
  ],
  "Moradia": [
    "aluguel","condomínio","iptu","material de limpeza","limpeza","faxina",
    "reforma","móvel","decoração","cama","sofá","colchão",
  ],
  "Compras": [
    "roupa","sapato","tênis","calçado","loja","shopping","amazon",
    "mercado livre","shopee","americanas","magazine","eletrônico",
    "celular","notebook","presente","perfume","cosméticos",
  ],
  "Educação": [
    "escola","faculdade","curso","aula","livro","material escolar",
    "udemy","alura","duolingo","inglês","espanhol","idioma","certificado",
  ],
};

function inferirCategoria(descricao: string, cats: { nome: string }[]): string {
  const txt = descricao.toLowerCase();
  for (const [base, kws] of Object.entries(CATEGORIA_KEYWORDS)) {
    if (kws.some(k => txt.includes(k))) {
      const exata = cats.find(c => c.nome.toLowerCase() === base.toLowerCase());
      if (exata) return exata.nome;
      const parcial = cats.find(c =>
        c.nome.toLowerCase().includes(base.slice(0, 5).toLowerCase()) ||
        base.toLowerCase().includes(c.nome.slice(0, 5).toLowerCase())
      );
      if (parcial) return parcial.nome;
    }
  }
  return cats[0]?.nome ?? "Outros";
}

// ── FERRAMENTAS ───────────────────────────────────────────

const TOOLS = [
  {
    name: "registrar_gasto",
    description: `Registra um gasto variável no Meu Hub.
Use quando o usuário disser coisas como:
- "gastei 45 no almoço"
- "paguei 120 de Uber no crédito santander"
- "50 reais no mercado no débito"`,
    inputSchema: {
      type: "object",
      properties: {
        descricao:       { type: "string",  description: "O que foi comprado/pago" },
        valor:           { type: "number",  description: "Valor em reais" },
        categoria:       { type: "string",  description: "Categoria (opcional, será inferida)" },
        meio:            { type: "string",  enum: ["debito","credito","pix","dinheiro","va"], description: "Meio de pagamento. Padrão: debito" },
        conta_ou_cartao: { type: "string",  description: "Nome da conta ou cartão" },
        data:            { type: "string",  description: "Data YYYY-MM-DD. Padrão: hoje" },
      },
      required: ["descricao", "valor"],
    },
  },
  {
    name: "listar_gastos_recentes",
    description: "Lista os gastos variáveis mais recentes.",
    inputSchema: {
      type: "object",
      properties: {
        limite: { type: "number", description: "Quantidade (padrão: 10)" },
      },
    },
  },
  {
    name: "listar_contas_e_cartoes",
    description: "Lista todas as contas bancárias e cartões cadastrados.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_categorias",
    description: "Lista as categorias de despesas disponíveis.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ── HANDLERS ─────────────────────────────────────────────

function hoje() { return new Date().toISOString().split("T")[0]; }
function fmtBRL(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }

const MEIOS: Record<string, string> = {
  debito:"Débito", credito:"Crédito", pix:"Pix", dinheiro:"Dinheiro", va:"Vale Alimentação",
};

async function callTool(name: string, args: Record<string, unknown>, userId: string): Promise<string> {
  if (name === "registrar_gasto") {
    const [{ data: contas }, { data: cats }] = await Promise.all([
      supabase.from("contas_bancarias").select("*").eq("user_id", userId),
      supabase.from("categorias").select("*").eq("user_id", userId),
    ]);

    const meio = (args.meio as string) || "debito";
    const data = (args.data as string) || hoje();
    const busca = ((args.conta_ou_cartao as string) || "").toLowerCase();

    let cartaoId: string | null = null;
    let contaId:  string | null = null;
    let contaLabel = "";

    if (contas?.length) {
      if (meio === "credito") {
        const cartoes = contas.filter(c => c.tipo === "cartao");
        const cartao = busca ? cartoes.find(c => c.nome.toLowerCase().includes(busca)) ?? cartoes[0] : cartoes[0];
        if (cartao) { cartaoId = cartao.id; contaLabel = cartao.nome; }
      } else if (meio === "debito" || meio === "pix") {
        const correntes = contas.filter(c => c.tipo === "corrente");
        const conta = busca ? correntes.find(c => c.nome.toLowerCase().includes(busca)) ?? correntes[0] : correntes[0];
        if (conta) { contaId = conta.id; contaLabel = conta.nome; }
      }
    }

    let categoria = (args.categoria as string) || null;
    if (categoria && cats?.length) {
      const match = cats.find(c => c.nome.toLowerCase().includes(categoria!.toLowerCase()));
      categoria = match ? match.nome : categoria;
    }
    if (!categoria) categoria = inferirCategoria(args.descricao as string, cats ?? []);

    const { error } = await supabase.from("gastos_variaveis").insert({
      id: `gv-mcp-${Date.now()}`,
      descricao: args.descricao,
      valor: args.valor,
      data,
      categoria,
      meio,
      cartao_id: cartaoId,
      conta_id:  contaId,
      user_id:   userId,
    });

    if (error) throw new Error(error.message);

    const d = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday:"short", day:"numeric", month:"short" });
    return [
      "✅ Gasto registrado!","",
      `📝 ${args.descricao}`,
      `💰 ${fmtBRL(args.valor as number)}`,
      `🏷️  ${categoria}`,
      `💳 ${MEIOS[meio]}${contaLabel ? ` · ${contaLabel}` : ""}`,
      `📅 ${d}`,
    ].join("\n");
  }

  if (name === "listar_gastos_recentes") {
    const { data } = await supabase
      .from("gastos_variaveis").select("*").eq("user_id", userId)
      .order("data", { ascending: false }).limit((args.limite as number) || 10);
    if (!data?.length) return "Nenhum gasto encontrado.";
    const total = data.reduce((a, g) => a + Number(g.valor), 0);
    const lista = data.map(g => {
      const d = new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" });
      return `• ${d} · ${g.descricao} — ${fmtBRL(g.valor)} · ${g.categoria}`;
    }).join("\n");
    return `Últimos ${data.length} gastos (total: ${fmtBRL(total)}):\n\n${lista}`;
  }

  if (name === "listar_contas_e_cartoes") {
    const { data } = await supabase.from("contas_bancarias").select("*").eq("user_id", userId).order("created_at");
    if (!data?.length) return "Nenhuma conta cadastrada.";
    const tipos: Record<string, string> = { corrente:"Conta Corrente", cartao:"Cartão de Crédito", investimento:"Investimento" };
    return `Contas e cartões:\n\n${data.map(c => `• ${c.nome} — ${tipos[c.tipo] || c.tipo}`).join("\n")}`;
  }

  if (name === "listar_categorias") {
    const { data } = await supabase.from("categorias").select("nome").eq("user_id", userId).order("nome");
    return `Categorias:\n\n${(data || []).map(c => `• ${c.nome}`).join("\n")}`;
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
}

// ── HANDLER PRINCIPAL ────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Chave de API inválida ou ausente." } },
      { status: 401, headers: CORS }
    );
  }

  const body = await req.json();
  const { method, params, id } = body;

  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "meu-hub", version: "1.0.0" },
      },
    }, { headers: CORS });
  }

  if (method === "tools/list") {
    return NextResponse.json(
      { jsonrpc: "2.0", id, result: { tools: TOOLS } },
      { headers: CORS }
    );
  }

  if (method === "tools/call") {
    try {
      const text = await callTool(params.name, params.arguments ?? {}, userId);
      return NextResponse.json({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text }] },
      }, { headers: CORS });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        jsonrpc: "2.0", id,
        error: { code: -32000, message: msg },
      }, { status: 500, headers: CORS });
    }
  }

  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code: -32601, message: "Método não encontrado." } },
    { status: 404, headers: CORS }
  );
}
