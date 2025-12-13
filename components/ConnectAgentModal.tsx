"use client";

import { useState, useEffect } from "react";
import { Link2, Check, Loader2, X, Bot } from "lucide-react";

interface ConnectAgentModalProps {
  kbId: string;
  kbName: string;
}

export function ConnectAgentModal({ kbId, kbName }: ConnectAgentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  // Busca os agentes ao abrir o modal
  useEffect(() => {
    if (isOpen && agents.length === 0) {
      fetchAgents();
    }
  }, [isOpen]);

  async function fetchAgents() {
    setLoading(true);
    try {
      // Você precisa ter essa rota de listar agentes. Se não tiver, usa a do Retell direto
      const res = await fetch('/api/agents/list'); 
      const data = await res.json();
      // O endpoint list geralmente retorna { agents: [...] } ou array direto dependendo da sua implementação
      setAgents(Array.isArray(data) ? data : data.agents || []);
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar agentes");
    } finally {
      setLoading(false);
    }
  }

  async function handleLink() {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const res = await fetch('/api/agents/update-kb', { // Sua rota existente
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            agentId: selectedAgent, 
            knowledgeBaseId: kbId 
        })
      });

      if (res.ok) {
        alert(`✅ Cérebro '${kbName}' conectado ao Agente!`);
        setIsOpen(false);
      } else {
        const err = await res.json();
        alert("Erro: " + err.error);
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-2 flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors w-full text-left outline-none"
      >
        <Link2 size={16} />
        <span>Conectar a um Agente</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h3 className="font-semibold text-white">Vincular Cérebro</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} className="text-gray-500 hover:text-white" /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Selecione qual agente vai usar a inteligência: <strong className="text-white">{kbName}</strong>
              </p>

              {loading && agents.length === 0 ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {agents.map((agent: any) => (
                    <button
                      key={agent.agent_id}
                      onClick={() => setSelectedAgent(agent.agent_id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        selectedAgent === agent.agent_id 
                          ? 'bg-blue-900/20 border-blue-500 text-white' 
                          : 'bg-black border-neutral-800 text-gray-400 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bot size={18} />
                        <span className="font-medium truncate">{agent.agent_name || "Agente Sem Nome"}</span>
                      </div>
                      {selectedAgent === agent.agent_id && <Check size={16} className="text-blue-500" />}
                    </button>
                  ))}
                  {agents.length === 0 && !loading && <p className="text-xs text-gray-500">Nenhum agente encontrado.</p>}
                </div>
              )}

              <button 
                onClick={handleLink}
                disabled={!selectedAgent || loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all"
              >
                {loading ? "Vinculando..." : "Confirmar Vínculo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}