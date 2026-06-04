"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    if (modo === "login") {
      const err = await signIn(email, senha);
      if (err) { setErro(err); setCarregando(false); return; }
      router.push("/");
    } else {
      const err = await signUp(email, senha);
      if (err) { setErro(err); setCarregando(false); return; }
      setSucesso(true);
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Meu Hub</h1>
          <p className="text-gray-500 mt-2 text-sm">Seu painel pessoal</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {/* Tabs login/cadastro */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setModo("login"); setErro(null); setSucesso(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                modo === "login" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setModo("cadastro"); setErro(null); setSucesso(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                modo === "cadastro" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Criar conta
            </button>
          </div>

          {sucesso ? (
            <div className="text-center py-4">
              <p className="text-emerald-400 text-sm font-medium mb-2">Conta criada!</p>
              <p className="text-gray-500 text-xs">
                Verifique seu e-mail para confirmar o cadastro, depois faça login.
              </p>
              <button
                onClick={() => { setModo("login"); setSucesso(false); }}
                className="mt-4 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
              >
                Ir para o login →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {erro && (
                <p className="text-red-400 text-xs bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors mt-1"
              >
                {carregando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : modo === "login" ? (
                  <><LogIn size={16} /> Entrar</>
                ) : (
                  <><UserPlus size={16} /> Criar conta</>
                )}
              </button>
            </form>
          )}
        </div>

        {modo === "cadastro" && !sucesso && (
          <p className="text-center text-xs text-gray-600 mt-4">
            O primeiro usuário cadastrado recebe o perfil de administrador.
          </p>
        )}
      </div>
    </div>
  );
}
