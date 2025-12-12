"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FileText, Plus, Database, Trash2, Loader2 } from "lucide-react";

export default function KnowledgeBasePage() {
  const [kbs, setKbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  
  // Para pegar a organização do usuário logado
  const supabase = createClient();
  const [orgId, setOrgId] = useState<string | null>(null);

  // Busca inicial
  useEffect(() => {
    fetchKbs();
    getUserOrg();
  }, []);

  async function getUserOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Truque rápido: Pegar a primeira org do usuário (ajuste conforme sua lógica de multi-tenant)
      // Idealmente, você tem isso no contexto ou metadata do usuário
      // Vou usar o ID da sua org principal que usamos antes como fallback se não achar
      const { data } = await supabase.from('organizations').select('id').limit(1).single();
      if (data) setOrgId(data.id);
    }
  }

  async function fetchKbs() {
    try {
      const res = await fetch('/api/knowledge-base/list');
      const data = await res.json();
      setKbs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newKbName || !orgId) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/knowledge-base/create', {
        method: 'POST',
        body: JSON.stringify({ name: newKbName, organization_id: orgId })
      });
      
      if (res.ok) {
        setNewKbName("");
        fetchKbs(); // Recarrega a lista
      }
    } catch (e) {
      alert("Erro ao criar");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="p-8 space-y-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inteligência (RAG)</h2>
          <p className="text-muted-foreground text-gray-400">
            Crie bases de conhecimento para treinar seus agentes.
          </p>
        </div>
      </div>

      {/* Área de Criação Rápida */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-400 mb-2 block">Nome da Nova Base</label>
          <input 
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            placeholder="Ex: Manual de Vendas 2025"
            className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
          />
        </div>
        <button 
          onClick={handleCreate}
          disabled={isCreating || !newKbName}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
          Criar Cérebro
        </button>
      </div>

      {/* Lista de KBs */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <p className="text-gray-500">Carregando cérebros...</p>
        ) : kbs.map((kb) => (
          <div key={kb.id} className="bg-black/40 border border-neutral-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer group relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                <Database size={24} />
              </div>
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900">
                {kb.status}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-1">{kb.name}</h3>
            <p className="text-xs text-gray-500 font-mono truncate">ID: {kb.retell_kb_id}</p>
            
            <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors">
              <FileText size={16} />
              <span>Gerenciar Fontes (Em breve)</span>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && kbs.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          Nenhuma base de conhecimento criada ainda.
        </div>
      )}
    </div>
  );
}