"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Profile } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { Shield, User, Crown, Loader2, UserPlus, X, Eye, EyeOff } from "lucide-react";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [criandoUsuario, setCriandoUsuario] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [isAdmin, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("profiles").select("*").order("created_at")
      .then(({ data }) => { setProfiles((data ?? []) as Profile[]); setLoading(false); });
  }, [isAdmin]);

  async function toggleRole(profile: Profile) {
    setAtualizando(profile.id);
    const novoRole = profile.role === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: novoRole }).eq("id", profile.id);
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: novoRole } : p));
    setAtualizando(null);
  }

  function handleUsuarioCriado(profile: Profile) {
    setProfiles(prev => [...prev, profile]);
    setCriandoUsuario(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Painel Admin</h2>
          <p className="text-gray-400 text-sm">Gerenciamento de usuários</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">
            Usuários cadastrados <span className="text-gray-500 font-normal">({profiles.length})</span>
          </h3>
          <button
            onClick={() => setCriandoUsuario(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={14} /> Criar usuário
          </button>
        </div>

        {profiles.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">Nenhum usuário encontrado.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    p.role === "admin" ? "bg-indigo-600/20" : "bg-gray-700/50"
                  }`}>
                    {p.role === "admin"
                      ? <Crown size={16} className="text-indigo-400" />
                      : <User size={16} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.nome ?? p.email}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    p.role === "admin"
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "bg-gray-700/50 text-gray-400"
                  }`}>
                    {p.role === "admin" ? "Administrador" : "Usuário"}
                  </span>
                  <button
                    onClick={() => toggleRole(p)}
                    disabled={atualizando === p.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {atualizando === p.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : p.role === "admin" ? "Tornar usuário" : "Tornar admin"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {criandoUsuario && (
        <ModalCriarUsuario
          onCriado={handleUsuarioCriado}
          onFechar={() => setCriandoUsuario(false)}
        />
      )}
    </div>
  );
}

// ── MODAL CRIAR USUÁRIO ───────────────────────────────────

function ModalCriarUsuario({ onCriado, onFechar }: {
  onCriado: (p: Profile) => void;
  onFechar: () => void;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    // Cliente temporário isolado — não afeta a sessão do admin
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { storageKey: "temp-create-user", persistSession: false } }
    );

    const { data, error } = await tempClient.auth.signUp({ email, password: senha });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    if (data.user) {
      // Aguarda o trigger criar o perfil
      await new Promise(r => setTimeout(r, 1000));
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      onCriado((profile ?? { id: data.user.id, email, role: "user", nome: null }) as Profile);
    }

    setCarregando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Criar usuário</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCriar} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Senha inicial</label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-red-400 text-xs bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <p className="text-xs text-gray-500">
            O usuário receberá o perfil de <strong className="text-gray-400">Usuário</strong> por padrão. Você pode promover para administrador depois.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {carregando ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> Criar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
