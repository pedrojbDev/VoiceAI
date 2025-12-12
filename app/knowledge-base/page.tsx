"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FileText, Plus, Database, Trash2, Loader2, AlertTriangle } from "lucide-react";

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
      // Busca a organização vinculada ao usuário
      const { data, error } = await supabase.from('organizations').select('id').limit(1).single();
      
      if (data) {
        setOrgId(data.id);
        console.log("✅ OrgID carregado:", data.id);
      } else {
        console.error("❌ Nenhuma organização encontrada para este usuário.", error);
      }
    }
  }

  async function fetchKbs() {
    try {
      const res = await fetch('/api/knowledge-base/list');
      if (res.ok) {
        const data = await res.json();
        setKbs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    // Trava de segurança: Não deixa enviar se não tiver OrgID
    if (!newKbName || !orgId) {
        console.warn("⛔ Tentativa de criação bloqueada: OrgID ausente.");
        alert("Erro: Organização não identificada. Verifique se você criou a 'organization' no Supabase.");
        return;
    }

    setIsCreating(true);

    try {
      const res = await fetch('/api/knowledge-base/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // CORREÇÃO CRÍTICA AQUI: O Backend espera 'organizationId' (CamelCase)
        body: JSON.stringify({ 
            name: newKbName, 
            organizationId: orgId 
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        setNewKbName("");
        // Opcional: Adicionar manualmente à lista para feedback instantâneo sem refetch
        fetchKbs(); 
      } else {
        alert(`Erro ao criar: ${data.details || data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão ao criar base.");
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
          {/* Debug Visual para você saber se o OrgID carregou */}
          <p className="text-xs text-gray-600 mt-1 font-mono">
            {orgId ? `Org Conectada: ${orgId}` : "⚠️ Buscando Organização..."}
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
          disabled={isCreating || !newKbName || !orgId}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
          Criar Cérebro
        </button>
      </div>

      {/* Lista de KBs */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <p className="text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4"/> Carregando cérebros...</p>
        ) : kbs.map((kb) => (
          <div key={kb.id} className="bg-black/40 border border-neutral-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer group relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                <Database size={24} />
              </div>
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900">
                {kb.status || "active"}
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
        <div className="text-center py-10 text-gray-500 border border-dashed border-neutral-800 rounded-xl">
          <Database className="mx-auto h-10 w-10 text-gray-700 mb-3" />
          <p>Nenhuma base de conhecimento criada ainda.</p>
          {!orgId && <p className="text-xs text-red-500 mt-2">Atenção: Nenhuma organização detectada. Verifique o Supabase.</p>}
        </div>
      )}
    </div>
  );
}