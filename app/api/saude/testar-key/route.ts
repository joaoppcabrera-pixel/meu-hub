import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  if (!apiKey?.startsWith("sk-ant-")) {
    return NextResponse.json({ ok: false, error: "Formato inválido. A chave deve começar com sk-ant-" });
  }
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 5,
      messages: [{ role: "user", content: "ok" }],
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Chave inválida ou sem créditos";
    const amigavel =
      msg.includes("401") || msg.includes("authentication")
        ? "Chave inválida. Verifique se copiou corretamente."
        : msg.includes("credit") || msg.includes("billing")
          ? "Sem créditos disponíveis. Adicione créditos em console.anthropic.com."
          : "Erro ao validar a chave. Tente novamente.";
    return NextResponse.json({ ok: false, error: amigavel });
  }
}
