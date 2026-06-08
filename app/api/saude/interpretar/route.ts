import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/** Extrai o primeiro objeto JSON válido de uma string, mesmo com texto ao redor */
function extrairJSON(texto: string): Record<string, unknown> {
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON não encontrado na resposta");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const { tipo, apiKey: bodyKey, ...dados } = await req.json();
    const resolvedKey = bodyKey || process.env.ANTHROPIC_API_KEY;
    if (!resolvedKey) {
      return NextResponse.json({ error: "API key não configurada" }, { status: 503 });
    }
    const client = new Anthropic({ apiKey: resolvedKey });

    // ── Classificar nível de atividade ────────────────────────────────────
    if (tipo === "atividade") {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 120,
        messages: [{
          role: "user",
          content: `Classifique o nível de atividade física. Seja CONSERVADOR (arredonde para baixo).
Níveis: sedentario(×1.2) | leve(×1.375) | moderado(×1.55) | ativo(×1.725) | muito_ativo(×1.9)
Rotina: "${dados.descricao}"
Responda APENAS com JSON: {"nivel":"sedentario|leve|moderado|ativo|muito_ativo","justificativa":"frase curta"}`,
        }],
      });
      const json = extrairJSON((msg.content[0] as { text: string }).text);
      return NextResponse.json(json);
    }

    // ── Interpretar objetivo ──────────────────────────────────────────────
    if (tipo === "objetivo") {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Analise o objetivo de saúde. TDEE: ${dados.tdee} kcal. Peso: ${dados.peso}kg.
Objetivo: "${dados.texto}"
Responda APENAS com JSON: {"tipo":"perda_peso|ganho_massa|recomposicao|manutencao","resumo":"frase curta direta","insight":"1-2 frases motivacionais personalizadas","superavit":false}
superavit deve ser true apenas para objetivo de ganho de massa muscular.`,
        }],
      });
      const json = extrairJSON((msg.content[0] as { text: string }).text);
      return NextResponse.json(json);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (err) {
    console.error("[saude/interpretar]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
