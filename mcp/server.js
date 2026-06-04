#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const USER_ID = process.env.USER_ID;

function hoje() {
  return new Date().toISOString().split("T")[0];
}

function formatBRL(valor) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

// Mapa de palavras-chave → categoria (case-insensitive)
const CATEGORIA_KEYWORDS = {
  "Alimentação": [
    "almoço","almoco","janta","jantar","café","cafe","lanche","lanchinho",
    "mercado","supermercado","padaria","açougue","acougue","hortifruti",
    "restaurante","ifood","rappi","uber eats","delivery","pizza","sushi",
    "hamburguer","hamburger","burguer","pastel","tapioca","comida","refeição",
    "refeicao","snack","doceria","sorveteria","sorvete","bebida","refrigerante",
    "cerveja","bar","boteco","churrasco","bares","açaí","acai","sanduíche",
    "sanduiche","pão","pao","fruta","verdura","legume",
  ],
  "Transporte": [
    "uber","99","cabify","taxi","táxi","ônibus","onibus","metro","metrô",
    "trem","combustível","combustivel","gasolina","etanol","diesel","posto",
    "estacionamento","pedágio","pedagio","passagem","bilhete","brt","vlt",
    "moto","aplicativo de transporte","scooter","patinete","bicicleta",
  ],
  "Saúde": [
    "farmácia","farmacia","remédio","remedio","medicamento","médico","medico",
    "consulta","hospital","clínica","clinica","exame","laboratório","laboratorio",
    "dentista","ortopedista","dermatologista","psicólogo","psicologo",
    "fisioterapia","academia","suplemento","vitamina","plano de saúde",
  ],
  "Lazer": [
    "cinema","filme","teatro","show","ingresso","netflix","spotify","amazon prime",
    "disney","hbo","youtube","jogo","game","steam","playstation","xbox",
    "viagem","hotel","airbnb","passeio","parque","museu","exposição","exposicao",
    "karaoke","bowling","boliche","escape room","paintball",
  ],
  "Serviços": [
    "internet","telefone","celular","conta de luz","água","agua","gás","gas",
    "conta","assinatura","mensalidade","streaming","netflix","spotify","apple",
    "google","icloud","adobe","dropbox","manutenção","manutencao","conserto",
    "lavanderia","cabeleireiro","barbearia","salão","salao","manicure",
    "pet shop","veterinário","veterinario",
  ],
  "Moradia": [
    "aluguel","condomínio","condominio","iptu","água","agua","luz","gás","gas",
    "material de limpeza","limpeza","faxina","reforma","móvel","movel",
    "decoração","decoracao","cama","sofá","sofa","colchão","colchao",
  ],
  "Compras": [
    "roupa","sapato","tênis","tenis","calçado","calcado","loja","shopping",
    "amazon","mercado livre","shopee","americanas","magazine","centauro",
    "eletrônico","eletronico","celular","notebook","tablet","acessório",
    "acessorio","presente","gift","perfume","cosméticos","cosmeticos",
  ],
  "Educação": [
    "escola","faculdade","curso","aula","livro","material escolar","mensalidade",
    "matrícula","matricula","udemy","alura","duolingo","inglês","ingles",
    "espanhol","idioma","certificado","treinamento",
  ],
  "Impostos": [
    "imposto","ir","irpf","ipva","iptu","taxa","multa","tributo","guia",
    "boleto","darf","licença","licenca","renovação","renovacao",
  ],
};

/**
 * Infere a melhor categoria com base na descrição do gasto,
 * cruzando com as categorias disponíveis no banco.
 */
function inferirCategoria(descricao, categoriasDisponiveis) {
  const texto = descricao.toLowerCase();

  // Para cada grupo de keywords, verifica se alguma aparece na descrição
  for (const [categoriaBase, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
    const match = keywords.some(kw => texto.includes(kw));
    if (!match) continue;

    // Tenta encontrar uma categoria disponível que tenha nome parecido
    const exata = categoriasDisponiveis.find(
      c => c.nome.toLowerCase() === categoriaBase.toLowerCase()
    );
    if (exata) return exata.nome;

    // Busca parcial (ex: "Alimentação" encontra "Alimentacao")
    const parcial = categoriasDisponiveis.find(c =>
      c.nome.toLowerCase().includes(categoriaBase.toLowerCase().slice(0, 5)) ||
      categoriaBase.toLowerCase().includes(c.nome.toLowerCase().slice(0, 5))
    );
    if (parcial) return parcial.nome;
  }

  // Fallback: primeira categoria disponível ou "Outros"
  return categoriasDisponiveis[0]?.nome ?? "Outros";
}

const MEIOS_LABEL = {
  debito: "Débito", credito: "Crédito", pix: "Pix",
  dinheiro: "Dinheiro", va: "Vale Alimentação",
};

// ── SERVER ───────────────────────────────────────────────

const server = new Server(
  { name: "meu-hub", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── TOOLS ────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "registrar_gasto",
      description: `Registra um gasto variável no Meu Hub.
Use quando o usuário disser coisas como:
- "gastei 45 no almoço"
- "paguei 120 de Uber no crédito santander"
- "50 reais no mercado no débito"
- "comprei algo por 30 no pix"`,
      inputSchema: {
        type: "object",
        properties: {
          descricao:       { type: "string",  description: "O que foi comprado/pago (ex: almoço, Uber, mercado)" },
          valor:           { type: "number",  description: "Valor em reais (ex: 45.90)" },
          categoria:       { type: "string",  description: "Categoria (ex: Alimentação, Transporte). Opcional — será inferida se não informada." },
          meio:            { type: "string",  enum: ["debito","credito","pix","dinheiro","va"], description: "Meio de pagamento. Padrão: debito" },
          conta_ou_cartao: { type: "string",  description: "Nome da conta ou cartão (ex: Santander, C6). Opcional." },
          data:            { type: "string",  description: "Data YYYY-MM-DD. Padrão: hoje" },
        },
        required: ["descricao", "valor"],
      },
    },
    {
      name: "listar_gastos_recentes",
      description: "Lista os gastos variáveis mais recentes do usuário.",
      inputSchema: {
        type: "object",
        properties: {
          limite: { type: "number", description: "Quantidade de registros (padrão: 10)" },
        },
      },
    },
    {
      name: "listar_contas_e_cartoes",
      description: "Lista todas as contas bancárias e cartões cadastrados. Útil para saber as opções antes de registrar um gasto.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "listar_categorias",
      description: "Lista todas as categorias de despesas disponíveis.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

// ── HANDLERS ─────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // ── registrar_gasto ──────────────────────────────────
    if (name === "registrar_gasto") {
      const [{ data: contas }, { data: categorias }] = await Promise.all([
        supabase.from("contas_bancarias").select("*").eq("user_id", USER_ID),
        supabase.from("categorias").select("*").eq("user_id", USER_ID),
      ]);

      const meio = args.meio || "debito";
      const data = args.data || hoje();
      const busca = (args.conta_ou_cartao || "").toLowerCase();

      // Resolves conta ou cartão
      let cartaoId = null;
      let contaId  = null;
      let contaLabel = "";

      if (contas?.length) {
        if (meio === "credito") {
          const cartoes = contas.filter(c => c.tipo === "cartao");
          const cartao  = busca
            ? cartoes.find(c => c.nome.toLowerCase().includes(busca)) ?? cartoes[0]
            : cartoes[0];
          if (cartao) { cartaoId = cartao.id; contaLabel = cartao.nome; }
        } else if (meio === "debito" || meio === "pix") {
          const correntes = contas.filter(c => c.tipo === "corrente");
          const conta     = busca
            ? correntes.find(c => c.nome.toLowerCase().includes(busca)) ?? correntes[0]
            : correntes[0];
          if (conta) { contaId = conta.id; contaLabel = conta.nome; }
        }
      }

      // Resolve categoria: usa a informada, tenta match, ou infere pela descrição
      let categoria = args.categoria || null;
      if (categoria && categorias?.length) {
        const match = categorias.find(c =>
          c.nome.toLowerCase().includes(categoria.toLowerCase())
        );
        categoria = match ? match.nome : categoria;
      }
      if (!categoria) {
        categoria = inferirCategoria(args.descricao, categorias ?? []);
      }

      const gasto = {
        id:         `gv-mcp-${Date.now()}`,
        descricao:  args.descricao,
        valor:      args.valor,
        data,
        categoria,
        meio,
        cartao_id:  cartaoId,
        conta_id:   contaId,
        user_id:    USER_ID,
      };

      const { error } = await supabase.from("gastos_variaveis").insert(gasto);
      if (error) throw error;

      const dataFmt = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "short", day: "numeric", month: "short",
      });

      return {
        content: [{
          type: "text",
          text: [
            `✅ Gasto registrado!`,
            ``,
            `📝 ${gasto.descricao}`,
            `💰 ${formatBRL(gasto.valor)}`,
            `🏷️  ${gasto.categoria}`,
            `💳 ${MEIOS_LABEL[meio]}${contaLabel ? ` · ${contaLabel}` : ""}`,
            `📅 ${dataFmt}`,
          ].join("\n"),
        }],
      };
    }

    // ── listar_gastos_recentes ───────────────────────────
    if (name === "listar_gastos_recentes") {
      const limite = args.limite || 10;
      const { data, error } = await supabase
        .from("gastos_variaveis")
        .select("*")
        .eq("user_id", USER_ID)
        .order("data", { ascending: false })
        .limit(limite);

      if (error) throw error;
      if (!data?.length) return { content: [{ type: "text", text: "Nenhum gasto encontrado." }] };

      const total = data.reduce((acc, g) => acc + Number(g.valor), 0);
      const lista = data.map(g => {
        const d = new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        return `• ${d} · ${g.descricao} — ${formatBRL(g.valor)} · ${g.categoria}`;
      }).join("\n");

      return {
        content: [{
          type: "text",
          text: `Últimos ${data.length} gastos (total: ${formatBRL(total)}):\n\n${lista}`,
        }],
      };
    }

    // ── listar_contas_e_cartoes ──────────────────────────
    if (name === "listar_contas_e_cartoes") {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at");

      if (error) throw error;
      if (!data?.length) return { content: [{ type: "text", text: "Nenhuma conta cadastrada." }] };

      const tipos = { corrente: "Conta Corrente", cartao: "Cartão de Crédito", investimento: "Investimento" };
      const lista = data.map(c => `• ${c.nome} — ${tipos[c.tipo] || c.tipo}`).join("\n");

      return { content: [{ type: "text", text: `Contas e cartões:\n\n${lista}` }] };
    }

    // ── listar_categorias ────────────────────────────────
    if (name === "listar_categorias") {
      const { data, error } = await supabase
        .from("categorias")
        .select("nome")
        .eq("user_id", USER_ID)
        .order("nome");

      if (error) throw error;
      const lista = (data || []).map(c => `• ${c.nome}`).join("\n");
      return { content: [{ type: "text", text: `Categorias:\n\n${lista}` }] };
    }

    return { content: [{ type: "text", text: `Ferramenta desconhecida: ${name}` }] };

  } catch (err) {
    return {
      content: [{ type: "text", text: `❌ Erro: ${err.message}` }],
      isError: true,
    };
  }
});

// ── START ─────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
