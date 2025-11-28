'use client';
import { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";

const retellWebClient = new RetellWebClient();

interface Agent {
  id: string;
  name: string;
  retell_agent_id: string;
  voice_id: string;
}

interface Stats {
  totalCalls: number;
  totalCost: string;
  totalMinutes: number;
}

export default function Home() {
  // --- ESTADOS ---
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCalls: 0, totalCost: '0.00', totalMinutes: 0 });
  
  // Formulário
  const [nome, setNome] = useState('');
  const [prompt, setPrompt] = useState('');
  const [customLLM, setCustomLLM] = useState(''); // NOVO: ID Manual do Cérebro
  
  const [loading, setLoading] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // --- EFEITOS ---
  useEffect(() => {
    fetchAgents();
    fetchStats();

    retellWebClient.on("call_started", () => console.log("Chamada iniciada"));
    retellWebClient.on("call_ended", () => {
      setActiveCallId(null);
      setTimeout(() => fetchStats(), 4000); 
    });
    retellWebClient.on("error", (err) => {
      console.error(err);
      setActiveCallId(null);
      alert("Erro na chamada");
    });
  }, []);

  // --- FUNÇÕES ---

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents/list');
      const data = await res.json();
      if (Array.isArray(data)) setAgents(data);
    } catch (err) { console.error(err); }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.totalCalls !== undefined) setStats(data);
    } catch (err) { console.error(err); }
  }

  async function criarAgente() {
    if (!nome) return alert('Digite um nome!');
    setLoading(true);
    
    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        body: JSON.stringify({ 
          name: nome,
          prompt: prompt, // Opcional se usar custom_llm_id
          custom_llm_id: customLLM // <--- Envia o ID manual se preenchido
        })
      });
      const data = await res.json();
      
      if (data.success) {
        // Limpa tudo após sucesso
        setNome('');
        setPrompt('');
        setCustomLLM('');
        fetchAgents();
      } else {
        alert("Erro ao criar: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function deletarAgente(agentId: string) {
    if (!confirm("Tem certeza?")) return;
    setAgents(prev => prev.filter(a => a.retell_agent_id !== agentId));
    try {
      await fetch('/api/agents/delete', {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId })
      });
    } catch (err) { fetchAgents(); }
  }

  async function toggleCall(agent: Agent) {
    if (activeCallId === agent.retell_agent_id) {
      retellWebClient.stopCall();
      setActiveCallId(null);
      return;
    }
    if (activeCallId) retellWebClient.stopCall();

    try {
      const res = await fetch('/api/calls/web-call', {
        method: 'POST',
        body: JSON.stringify({ agent_id: agent.retell_agent_id })
      });
      const data = await res.json();
      await retellWebClient.startCall({ accessToken: data.access_token });
      setActiveCallId(agent.retell_agent_id);
    } catch (err) { alert("Erro ao ligar."); }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* CABEÇALHO */}
        <header className="mb-8 border-b border-neutral-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Voice AI Dashboard</h1>
            <p className="text-neutral-400 mt-1">Gestão de Atendimento Inteligente</p>
          </div>
          <div className="text-right">
             <span className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded-full border border-green-700">Sistema Online</span>
          </div>
        </header>

        {/* METRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg">
            <p className="text-neutral-400 text-sm font-medium mb-1">Total de Chamadas</p>
            <h2 className="text-3xl font-bold text-white">{stats.totalCalls}</h2>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg">
            <p className="text-neutral-400 text-sm font-medium mb-1">Minutos Otimizados</p>
            <h2 className="text-3xl font-bold text-blue-400">{stats.totalMinutes}m</h2>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
            <p className="text-neutral-400 text-sm font-medium mb-1">Investimento Total</p>
            <h2 className="text-3xl font-bold text-green-400">${stats.totalCost}</h2>
          </div>
        </div>

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
                placeholder="Ex: Recepcionista IGH" 
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder-neutral-600"
              />
            </div>

            {/* ABAS / OPÇÕES DE CRIAÇÃO */}
            <div className="space-y-4">
                
                {/* Opção 1: Simples (Prompt) */}
                <div className={`p-4 rounded-lg border ${!customLLM ? 'border-blue-600 bg-blue-900/10' : 'border-neutral-800 bg-neutral-900'} transition-all`}>
                    <p className="text-xs font-bold uppercase mb-2 text-neutral-400">Opção A: Criação Rápida (Simples)</p>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={!!customLLM} // Desabilita se estiver usando ID manual
                        placeholder="Escreva aqui como o robô deve se comportar..." 
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder-neutral-600 h-20 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Opção 2: Avançado (ID Manual) */}
                <div className={`p-4 rounded-lg border ${customLLM ? 'border-purple-600 bg-purple-900/10' : 'border-neutral-800 bg-neutral-900'} transition-all`}>
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold uppercase text-purple-400">Opção B: Conectar Cérebro Pronto (Com Tools)</p>
                        {customLLM && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded">Ativo</span>}
                    </div>
                    <input 
                        type="text" 
                        value={customLLM}
                        onChange={(e) => setCustomLLM(e.target.value)}
                        placeholder="Cole aqui o LLM ID do painel Retell (ex: llm_12345...)" 
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none font-mono"
                    />
                    <p className="text-[10px] text-neutral-500 mt-2">
                        Use esta opção para conectar agentes complexos com Ferramentas configuradas manualmente no Dashboard da Retell.
                    </p>
                </div>

            </div>
          </div>

          <button 
            onClick={criarAgente}
            disabled={loading}
            className={`disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors h-[52px] shadow-lg mb-[1px] ${customLLM ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
          >
            {loading ? 'Criando...' : '+ Criar Novo'}
          </button>
        </div>

        {/* LISTAGEM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const isSpeaking = activeCallId === agent.retell_agent_id;
            return (
              <div key={agent.id} className={`relative p-6 rounded-xl border transition-all duration-300 ${isSpeaking ? 'border-green-500 bg-green-900/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'}`}>
                <button 
                  onClick={(e) => { e.stopPropagation(); deletarAgente(agent.retell_agent_id); }}
                  className="absolute top-4 right-4 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-all"
                >🗑️</button>
                <div className="mb-4 pr-10">
                  <h3 className="font-bold text-xl text-white mb-1">{agent.name}</h3>
                  <p className="text-xs text-neutral-500 font-mono truncate">{agent.retell_agent_id}</p>
                </div>
                <div className="flex gap-2 items-center mb-6">
                   <span className="text-[10px] uppercase font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800">
                    {agent.voice_id?.includes('custom') ? 'Voz Nativa' : 'Padrão'}
                  </span>
                   <span className="text-[10px] uppercase font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800">PT-BR</span>
                </div>
                <button 
                  onClick={() => toggleCall(agent)}
                  className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isSpeaking 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 animate-pulse' 
                      : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02]'
                  }`}
                >
                  {isSpeaking ? <>🟥 Parar Chamada</> : <>🎙️ Testar Audio</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}