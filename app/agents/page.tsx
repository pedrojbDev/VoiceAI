'use client';
import { useState, useEffect } from 'react';
import { RetellWebClient } from "retell-client-js-sdk";
import { Users, Trash2, Mic, PhoneOff, Cpu } from 'lucide-react';

// Inicializa o cliente para Web Call (Navegador)
const retellWebClient = new RetellWebClient();

interface Agent {
  id: string;
  name: string;
  retell_agent_id: string;
  voice_id: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Estados para criar novo agente
  const [nome, setNome] = useState('');
  const [prompt, setPrompt] = useState('');
  const [customLLM, setCustomLLM] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // Carrega agentes ao abrir a página
  useEffect(() => {
    fetchAgents();

    // Listeners para Web Call
    retellWebClient.on("call_started", () => console.log("Web Call iniciada"));
    retellWebClient.on("call_ended", () => setActiveCallId(null));
    retellWebClient.on("error", (err) => { 
      console.error(err); 
      setActiveCallId(null); 
    });
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents/list');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgents(data);
      } else {
        console.error("Erro ao buscar agentes:", data);
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
    }
  }

  async function criarAgente() {
    if (!nome) return alert('Digite um nome!');
    setLoading(true);
    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        body: JSON.stringify({ 
          name: nome, 
          prompt: prompt, 
          custom_llm_id: customLLM 
        })
      });
      
      if (res.ok) {
        setNome(''); 
        setPrompt(''); 
        setCustomLLM('');
        fetchAgents(); // Recarrega a lista
      } else { 
        const erro = await res.json();
        alert('Erro ao criar: ' + (erro.error || 'Desconhecido')); 
      }
    } catch (err) { 
      alert('Erro de conexão ao criar agente'); 
    } 
    finally { 
      setLoading(false); 
    }
  }

  async function deletarAgente(id: string) {
    if (!confirm('Tem certeza que deseja apagar este agente?')) return;
    
    // Otimista: Remove da tela antes de confirmar
    setAgents(prev => prev.filter(a => a.retell_agent_id !== id));
    
    try {
      await fetch('/api/agents/delete', { 
        method: 'POST', 
        body: JSON.stringify({ agent_id: id }) 
      });
    } catch (err) {
      alert("Erro ao deletar");
      fetchAgents(); // Reverte se der erro
    }
  }

  // Função para testar via Navegador (Sem gastar telefone)
  async function toggleWebCall(agent: Agent) {
    if (activeCallId) { 
      retellWebClient.stopCall(); 
      setActiveCallId(null); 
      return; 
    }
    
    try {
      const res = await fetch('/api/calls/web-call', { 
        method: 'POST', 
        body: JSON.stringify({ agent_id: agent.retell_agent_id }) 
      });
      const data = await res.json();
      
      await retellWebClient.startCall({ 
        accessToken: data.access_token 
      });
      setActiveCallId(agent.retell_agent_id);
    } catch (err) { 
      alert('Erro ao iniciar Web Call'); 
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER LIMPO (Sem input de telefone) */}
      <header className="mb-8 border-b border-neutral-800 pb-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white">Meus Agentes</h1>
            <p className="text-neutral-400 mt-1">Gerenciamento e Testes</p>
        </div>
      </header>

      {/* FORMULÁRIO DE CRIAÇÃO */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl mb-10 shadow-sm">
        <div className="grid gap-4 mb-4">
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Nome do Robô</label>
            <input 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Ex: Atendente IGH" 
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white outline-none focus:border-blue-600 transition-colors" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="text-sm text-neutral-400 mb-1 block">Opção A: Prompt Simples (Criação Rápida)</label>
               <textarea 
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)} 
                  disabled={!!customLLM} 
                  placeholder="Você é uma recepcionista..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white h-24 resize-none disabled:opacity-30 outline-none focus:border-blue-600" 
               />
            </div>
            <div>
               <label className="text-sm text-purple-400 mb-1 block font-bold">Opção B: Conectar Cérebro (ID Retell)</label>
               <input 
                  value={customLLM} 
                  onChange={e => setCustomLLM(e.target.value)} 
                  placeholder="llm_..." 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white font-mono text-sm focus:border-purple-600 outline-none" 
               />
               <p className="text-xs text-neutral-600 mt-2">Cole o ID do LLM criado no painel da Retell para usar ferramentas avançadas.</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={criarAgente} 
          disabled={loading} 
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg w-full md:w-auto transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Criando Robô...' : '+ Criar Novo Agente'}
        </button>
      </div>

      {/* LISTA DE AGENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.length === 0 && (
          <div className="col-span-2 text-center py-10 text-neutral-500">
            Nenhum agente criado ainda. Crie o primeiro acima! 🤖
          </div>
        )}

        {agents.map(agent => (
          <div key={agent.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-neutral-700 transition-all relative group">
            
            {/* Botão de Deletar (Só aparece ao passar o mouse) */}
            <button 
              onClick={() => deletarAgente(agent.retell_agent_id)} 
              className="absolute top-4 right-4 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
              title="Deletar Agente"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-neutral-800 p-3 rounded-full border border-neutral-700">
                <Users size={20} className="text-blue-400"/>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{agent.name}</h3>
                <p className="text-xs text-neutral-500 font-mono">{agent.retell_agent_id}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
                <span className="text-[10px] uppercase font-bold bg-neutral-950 px-2 py-1 rounded text-neutral-400 border border-neutral-800 flex items-center gap-1">
                  <Cpu size={10}/> {agent.voice_id?.includes('custom') ? 'Voz Nativa (Thais)' : 'Voz Padrão'}
                </span>
            </div>

            {/* BOTÃO ÚNICO: Web Call */}
            <div className="flex gap-2">
                <button 
                  onClick={() => toggleWebCall(agent)} 
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    activeCallId === agent.retell_agent_id 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/50' 
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {activeCallId === agent.retell_agent_id 
                    ? <><PhoneOff size={18}/> Encerrar Teste</> 
                    : <><Mic size={18}/> Testar no Navegador</>
                  }
                </button>
            </div>
            
            <div className="mt-3 text-center">
               <p className="text-[10px] text-neutral-600">
                 Para testar via telefone, ligue para o seu número configurado.
               </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}