'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login e Cadastro
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  async function handleAuth() {
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // --- CADASTRO (Cria usuário + Organização automática via SQL) ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // O SQL que criamos vai pegar esse nome e criar a "Org do Fulano"
            data: { full_name: email.split('@')[0] } 
          }
        });
        if (error) throw error;
        setMessage({ text: 'Conta criada! Verifique seu e-mail para confirmar.', type: 'success' });
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        router.push('/'); // Manda para o Dashboard
        router.refresh();
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Erro na autenticação', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-600/20">
            <Lock className="text-blue-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Voice<span className="text-blue-500">AI</span> Admin
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            {isSignUp ? 'Crie sua organização agora' : 'Acesse seu painel de controle'}
          </p>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">E-mail</label>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 focus-within:border-blue-600 transition-colors">
              <Mail size={18} className="text-neutral-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-transparent p-3 text-white outline-none placeholder-neutral-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">Senha</label>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 focus-within:border-blue-600 transition-colors">
              <Lock size={18} className="text-neutral-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent p-3 text-white outline-none placeholder-neutral-600"
              />
            </div>
          </div>

          {/* Mensagens de Erro/Sucesso */}
          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
              {message.text}
            </div>
          )}

          <button 
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta Grátis' : 'Entrar na Plataforma')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>

        {/* Rodapé (Toggle) */}
        <div className="mt-6 text-center pt-6 border-t border-neutral-800">
          <p className="text-neutral-500 text-sm">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem acesso?'}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="text-blue-400 hover:text-blue-300 ml-2 font-bold hover:underline"
            >
              {isSignUp ? 'Fazer Login' : 'Criar Conta'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}