"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // Toggle entre Login e Cadastro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados de Interface
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        // --- LÓGICA DE LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Sucesso no Login
        setSuccessMsg("Login realizado com sucesso! Entrando...");
        router.refresh(); // Atualiza os cookies
        setTimeout(() => {
          router.push("/"); // Força a ida para o Dashboard
        }, 800); // Pequeno delay para o usuário ler a mensagem
      } else {
        // --- LÓGICA DE CRIAR CONTA (SIGN UP) ---
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg("Conta criada! Verifique seu email para confirmar.");
        } else {
          setSuccessMsg("Conta criada com sucesso! Acessando...");
          router.refresh();
          setTimeout(() => router.push("/"), 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      // Só paramos o loading se der erro, se der sucesso mantemos o spinner até redirecionar
      if (error) setLoading(false); 
      // Se for cadastro com confirmação de email, paramos o loading
      if (!isLogin) setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md space-y-8 p-8 border border-gray-800 rounded-xl bg-gray-950 shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Voice<span className="text-blue-500">AI</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isLogin ? "Acesse seu painel administrativo" : "Crie sua conta White Label"}
          </p>
        </div>

        {/* Formulário */}
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 ml-1">Email Corporativo</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-800 bg-gray-900 py-3 px-4 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 ml-1">Senha</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-lg border border-gray-800 bg-gray-900 py-3 px-4 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Feedback de Erro */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Feedback de Sucesso */}
          {successMsg && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/30 p-3 rounded-lg border border-green-900/50">
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              isLogin ? "Entrar na Plataforma" : "Criar Conta Grátis"
            )}
          </button>
        </form>

        {/* Toggle Login/Cadastro */}
        <div className="text-center text-sm">
          <span className="text-gray-500">
            {isLogin ? "Ainda não tem conta?" : "Já possui cadastro?"}
          </span>{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMsg(null);
            }}
            className="font-semibold text-blue-500 hover:text-blue-400 hover:underline transition-all"
          >
            {isLogin ? "Criar conta agora" : "Fazer Login"}
          </button>
        </div>
      </div>
    </div>
  );
}