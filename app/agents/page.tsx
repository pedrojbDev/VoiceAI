'use client';
import { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import { Users, Trash2, Mic, PhoneOff, Cpu } from 'lucide-react';

const retellWebClient = new RetellWebClient();

interface Agent {
  id: string;
  name: string;
  retell_agent_id: string;
  voice_id: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [nome, setNome] = useState('');
  const [prompt, setPrompt] = useState('');
  const [customLLM, setCustomLLM] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    retellWebClient.on("call_started", () => console.log("Call iniciada"));
    retellWebClient.on("call_ended", () => setActiveCallId(null));
    retellWebClient.on("error", (err) => { console.error(err); setActiveCallId(null); });
  }, []);

  async function fetchAgents() {
    const res = await fetch('/api/agents/list');
    const data = await res.json();
    if (Array.isArray(data)) setAgents(data);
  }

  async function criarAgente() {
    if (!nome) return alert('Digite um nome!');
    setLoading(true);
    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        body: JSON.stringify({ name: nome, prompt, custom_llm_id: customLLM })
      });
      if (res.ok) {
        setNome(''); setPrompt(''); setCustomLLM('');
        fetchAgents();
      } else {
        alert('Erro ao criar');
      }
    } catch (err) { alert('Erro de conexão'); } 
    finally { setLoading(false); }
  }

  async function deletarAgente(id: string) {
    if (!confirm('Tem certeza?')) return;
    setAgents(prev => prev.filter(a => a.retell_agent_id !== id));
    await fetch('/api/agents/delete', { method: 'POST', body: JSON.stringify({ agent_id: id }) });
  }

  async function toggleCall(agent: Agent) {
    if (activeCallId) { retellWebClient.stopCall(); setActiveCallId(null); return; }
    try {
      const res = await fetch('/api/calls/web-call', { method: 'POST', body: JSON.stringify({ agent_id: agent.retell_agent_id }) });
      const data = await res.json();
      await retellWebClient.startCall({ accessToken: data.access_token });
      setActiveCallId(agent.retell_agent_id);
    } catch (err) { alert('Erro ao ligar'); }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Meus Agentes</h1>
        <p className="text-neutral-400 mt-1">Crie e gerencie seus funcionários digitais.</p>
      </header>

      {/* CRIAR */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl mb-10 shadow-sm">
        <div className="grid gap-4 mb-4">
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Nome do Agente</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Atendente IGH" className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white outline-none focus:border-blue-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="text-sm text-neutral-400 mb-1 block">Opção A: Prompt Simples</label>
               <textarea value={prompt} onChange={e => setPrompt(e.target.value)} disabled={!!customLLM} placeholder="Instruções básicas..." className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white h-24 resize-none disabled:opacity-30" />
            </div>
            <div>
               <label className="text-sm text-purple-400 mb-1 block font-bold">Opção B: Conectar Cérebro (LLM ID)</label>
               <input value={customLLM} onChange={e => setCustomLLM(e.target.value)} placeholder="Cole o ID do LLM..." className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white font-mono text-sm focus:border-purple-600" />
               <p className="text-xs text-neutral-500 mt-2">Para usar ferramentas configuradas no Painel Retell.</p>
            </div>
          </div>
        </div>
        <button onClick={criarAgente} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg w-full md:w-auto transition-colors">
          {loading ? 'Criando...' : '+ Criar Novo Agente'}
        </button>
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-neutral-600 transition-all relative group">
            <button onClick={() => deletarAgente(agent.retell_agent_id)} className="absolute top-4 right-4 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 size={18} /></button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-neutral-800 p-3 rounded-full"><Users size={20} className="text-blue-400"/></div>
              <div>
                <h3 className="font-bold text-lg text-white">{agent.name}</h3>
                <p className="text-xs text-neutral-500 font-mono">{agent.retell_agent_id}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
                <span className="text-[10px] uppercase font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800 flex items-center gap-1">
                  <Cpu size={10}/> {agent.voice_id?.includes('custom') ? 'Voz Nativa' : 'Padrão'}
                </span>
                <span className="text-[10px] uppercase font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800">PT-BR</span>
            </div>

            <button onClick={() => toggleCall(agent)} className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeCallId === agent.retell_agent_id ? 'bg-red-500/10 text-red-500 border border-red-500/50 animate-pulse' : 'bg-white text-black hover:bg-neutral-200'}`}>
              {activeCallId === agent.retell_agent_id ? <><PhoneOff size={18}/> Desligar</> : <><Mic size={18}/> Testar Audio</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}