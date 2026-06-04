import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const uid = process.env.USER_ID;
const fmt = v => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

const [{ data: contas }, { data: entradas }, { data: gastos }] = await Promise.all([
  sb.from("contas_bancarias").select("*").eq("user_id", uid),
  sb.from("entradas").select("*").eq("user_id", uid),
  sb.from("gastos_variaveis").select("*").eq("user_id", uid),
]);

console.log("=== SALDO POR CONTA ===");
for (const c of (contas ?? []).filter(c => c.tipo === "corrente")) {
  const totalEnt = (entradas ?? []).filter(e => e.conta_id === c.id).reduce((a, e) => a + Number(e.valor), 0);
  const totalDeb = (gastos ?? []).filter(g => g.conta_id === c.id && (g.meio === "debito" || g.meio === "pix")).reduce((a, g) => a + Number(g.valor), 0);
  const saldo = Number(c.saldo_inicial ?? 0) + totalEnt - totalDeb;
  console.log(`  ${c.nome}: saldo=${fmt(saldo)} | inicial=${fmt(c.saldo_inicial ?? 0)} | +entradas=${fmt(totalEnt)} | -debitos=${fmt(totalDeb)}`);
}
