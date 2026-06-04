"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Key, Plus, Trash2, Copy, Check, ExternalLink, Loader2 } from "lucide-react";

interface ApiKey {
  id: string;
  nome: string;
  key: string;
  created_at: string;
}

export default function ApiKeysSection() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_api_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setKeys((data ?? []) as ApiKey[]); setLoading(false); });
  }, [user]);

  async function criarChave() {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_api_keys")
      .insert({ user_id: user.id, nome: novoNome.trim() || "Minha chave" })
      .select()
      .single();
    if (!error && data) {
      setKeys(prev => [data as ApiKey, ...prev]);
      setNovoNome("");
      setCriando(false);
    }
  }

  async function excluirChave(id: string) {
    await supabase.from("user_api_keys").delete().eq("id", id);
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  const mcpUrl = `${appUrl}/api/mcp`;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Integrações MCP</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Conecte o Claude ao Meu Hub via chave de API
          </p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nova chave
        </button>
      </div>

      {/* Formulário nova chave */}
      {criando && (
        <div className="bg-gray-900 border border-indigo-600/40 rounded-xl p-4 mb-4 flex gap-2">
          <input
            autoFocus
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === "Enter" && criarChave()}
            placeholder="Nome da chave (ex: Claude.ai, Meu notebook)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
          />
          <button onClick={criarChave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors">
            Criar
          </button>
          <button onClick={() => setCriando(false)} className="px-3 py-2 bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-xl transition-colors text-sm">
            Cancelar
          </button>
        </div>
      )}

      {/* URL do servidor */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">URL do servidor MCP</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-indigo-300 bg-gray-800 px-3 py-2 rounded-lg truncate">
            {mcpUrl}
          </code>
          <button
            onClick={() => copiar(mcpUrl, "url")}
            className="shrink-0 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Copiar URL"
          >
            {copiado === "url" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Lista de chaves */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
      ) : keys.length === 0 ? (
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center">
          <Key size={28} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">Nenhuma chave criada</p>
          <button onClick={() => setCriando(true)} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            + Criar primeira chave
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {keys.map(k => (
            <div key={k.id} className="group bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">{k.nome}</p>
                  <p className="text-xs text-gray-500">
                    Criada em {new Date(k.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => excluirChave(k.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1.5 rounded-lg"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg truncate font-mono">
                  {k.key}
                </code>
                <button
                  onClick={() => copiar(k.key, k.id)}
                  className="shrink-0 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Copiar chave"
                >
                  {copiado === k.id ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instruções */}
      {keys.length > 0 && (
        <div className="mt-6 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Como usar</h4>
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <div>
              <p className="text-white text-xs font-medium mb-1">Claude.ai (chat)</p>
              <p>Acesse <span className="text-indigo-400">claude.ai → Settings → Integrations → Add MCP Server</span>. Cole a URL e selecione "Bearer Token" como autenticação, colando sua chave.</p>
            </div>
            <div>
              <p className="text-white text-xs font-medium mb-1">Claude Code (qualquer computador)</p>
              <p>Execute no terminal:</p>
              <code className="block mt-1 text-xs bg-gray-800 px-3 py-2 rounded-lg text-gray-300 break-all">
                {`claude mcp add meu-hub --transport http "${mcpUrl}" --header "Authorization: Bearer SUA_CHAVE"`}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
