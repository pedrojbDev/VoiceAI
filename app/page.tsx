'use client';
import { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";

// Inicializa o cliente fora do componente para não recriar a cada render
const retellWebClient = new RetellWebClient();

// Definição do tipo para o TypeScript não reclamar
interface Agent {
  id: string;
  name: string;
  retell_agent_id: string;
  voice_id: string;
}

export default function Home() {
  // --- ESTADOS ---
  const [agents, setAgents] = useState<Agent[]>([]);
  const [nome, setNome] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // --- EFEITOS (Ao carregar a página) ---
  useEffect(() => {
    fetchAgents();

    // Ouvintes de eventos da Retell (para mudar o botão quando a call começa/termina)
    retellWebClient.on("call_started", () => console.log("Chamada iniciada"));
    retellWebClient.on("call_ended", () => setActiveCallId(null));
    retellWebClient.on("error", (err) => {
      console.error("Erro na chamada:", err);
      setActiveCallId(null);
      alert("Erro na conexão de voz. Veja o console.");
    });
  }, []);

  // --- FUNÇÕES ---

  // 1. Buscar lista de agentes no banco
  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents/list');
      const data = await res.json();
      // Garante que é um array antes de setar
      if (Array.isArray(data)) {
        setAgents(data);
      }
    } catch (err) {
      console.error("Erro ao buscar agentes", err);
    }
  }

  // 2. Criar novo agente
async function criarAgente() {
    if (!nome) return alert('Digite um nome para o agente!');
    setLoading(true);
    
    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        body: JSON.stringify({ 
          name: nome,
          // Agora enviamos o prompt. Se estiver vazio, envia um texto padrão.
          prompt: prompt || "Você é um assistente virtual prestativo e fala português do Brasil."
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setNome('');   // Limpa o campo nome
        setPrompt(''); // Limpa o campo prompt também
        fetchAgents(); // Recarrega a lista
      } else {
        alert("Erro ao criar: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("Erro de conexão ao criar.");
    } finally {
      setLoading(false);
    }
  }

  // 3. Deletar agente (Função Nova)
  async function deletarAgente(agentId: string) {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return;

    // Atualiza a tela NA HORA (Optimistic UI) para parecer instantâneo
    setAgents(prev => prev.filter(a => a.retell_agent_id !== agentId));

    try {
      await fetch('/api/agents/delete', {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId })
      });
      // Sucesso silencioso
    } catch (err) {
      alert("Erro ao deletar no servidor.");
      fetchAgents(); // Se deu erro, traz ele de volta para a lista
    }
  }

  // 4. Ligar ou Desligar (Web Call)
  async function toggleCall(agent: Agent) {
    // Se já estiver falando com ESSE agente, desliga
    if (activeCallId === agent.retell_agent_id) {
      retellWebClient.stopCall();
      setActiveCallId(null);
      return;
    }

    // Se estiver falando com OUTRO, desliga o anterior primeiro
    if (activeCallId) {
      retellWebClient.stopCall();
    }

    // Inicia nova chamada
    try {
      // Pede o token para o backend
      const res = await fetch('/api/calls/web-call', {
        method: 'POST',
        body: JSON.stringify({ agent_id: agent.retell_agent_id })
      });
      const data = await res.json();
      
      if (data.access_token) {
        await retellWebClient.startCall({ accessToken: data.access_token });
        setActiveCallId(agent.retell_agent_id);
      } else {
        alert("Erro: Não foi possível iniciar a chamada (Token inválido).");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao tentar ligar.");
    }
  }

  // --- RENDERIZAÇÃO (HTML) ---
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* CABEÇALHO */}
        <header className="mb-10 border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">Meus Agentes de Voz</h1>
          <p className="text-neutral-400 mt-1">SaaS White Label Dashboard</p>
        </header>

{/* ÁREA DE CRIAÇÃO */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl mb-10 flex gap-4 items-end shadow-lg">
          
          <div className="flex-1 flex flex-col gap-4">
            {/* Campo Nome */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Nome do Robô</label>
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Agente de Vendas..." 
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder-neutral-600"
              />
            </div>

            {/* Campo Prompt (NOVO) */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Personalidade (Prompt)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Você é a recepcionista da Clínica. Seja breve e educada. Pergunte o nome e convênio..." 
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder-neutral-600 h-24 text-sm resize-none"
              />
            </div>
          </div>

          <button 
            onClick={criarAgente}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors h-[52px] shadow-lg shadow-blue-900/20 mb-[1px]"
          >
            {loading ? 'Criando...' : '+ Criar Novo'}
          </button>
        </div>

        {/* LISTAGEM (GRID DE CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const isSpeaking = activeCallId === agent.retell_agent_id;
            
            return (
              <div key={agent.id} className={`relative p-6 rounded-xl border transition-all duration-300 ${isSpeaking ? 'border-green-500 bg-green-900/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800'}`}>
                
                {/* Botão de Deletar (Lixeira) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deletarAgente(agent.retell_agent_id);
                  }}
                  className="absolute top-4 right-4 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-all"
                  title="Excluir Agente"
                >
                  🗑️
                </button>

                {/* Informações do Agente */}
                <div className="mb-4 pr-10">
                  <h3 className="font-bold text-xl text-white mb-1">{agent.name}</h3>
                  <p className="text-xs text-neutral-500 font-mono truncate select-all" title="Clique para selecionar">{agent.retell_agent_id}</p>
                </div>

                {/* Tags */}
                <div className="flex gap-2 items-center mb-6">
                   <span className="text-[10px] uppercase tracking-wider font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800">
                    {agent.voice_id?.includes('openai') ? 'OpenAI' : 'ElevenLabs'}
                  </span>
                   <span className="text-[10px] uppercase tracking-wider font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800">
                    PT-BR
                  </span>
                </div>

                {/* Botão de Ação Principal */}
                <button 
                  onClick={() => toggleCall(agent)}
                  className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isSpeaking 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 animate-pulse' 
                      : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02]'
                  }`}
                >
                  {isSpeaking ? (
                    <>🟥 Parar Chamada</>
                  ) : (
                    <>🎙️ Testar Audio</>
                  )}
                </button>
              </div>
            );
          })}
          
          {/* Estado Vazio */}
          {agents.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
              <p className="text-lg mb-2">Nenhum agente encontrado</p>
              <p className="text-sm">Use o formulário acima para criar seu primeiro robô.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}