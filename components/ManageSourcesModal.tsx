"use client";

import { useState } from "react";
import { FileText, Link as LinkIcon, Plus, Loader2, X, Globe, Type } from "lucide-react";

interface ManageSourcesModalProps {
  kbId: string;
  kbName: string;
}

export function ManageSourcesModal({ kbId, kbName }: ManageSourcesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Inputs
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");

  const handleSubmit = async () => {
    if (mode === 'url' && !url) return alert("Digite uma URL válida.");
    if (mode === 'text' && (!textTitle || !textContent)) return alert("Preencha título e conteúdo.");

    setLoading(true);
    try {
      // Prepara o payload
      const body = mode === 'url' 
        ? { knowledgeBaseId: kbId, url } 
        : { knowledgeBaseId: kbId, title: textTitle, text: textContent };

      const res = await fetch('/api/knowledge-base/add-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("✅ Fonte adicionada com sucesso!");
        setIsOpen(false); // Fecha o modal
        // Limpa os campos
        setUrl("");
        setTextTitle("");
        setTextContent("");
      } else {
        alert("Erro: " + (data.details || data.error));
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao enviar fonte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Gatilho (Que aparece no Card) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors w-full text-left outline-none"
      >
        <FileText size={16} />
        <span>Gerenciar Fontes</span>
      </button>

      {/* O Modal (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h3 className="font-semibold text-white">Adicionar ao Cérebro</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Base: {kbName}</p>

              {/* Tabs de Seleção */}
              <div className="flex bg-black rounded-lg p-1 border border-neutral-800">
                <button 
                  onClick={() => setMode('url')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-all ${mode === 'url' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Globe size={14} /> Via URL
                </button>
                <button 
                  onClick={() => setMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-all ${mode === 'text' ? 'bg-neutral-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Type size={14} /> Texto Manual
                </button>
              </div>

              {/* Conteúdo Dinâmico */}
              {mode === 'url' ? (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Link do Site</label>
                  <div className="flex items-center gap-2 bg-black border border-neutral-700 focus-within:border-blue-500 rounded-lg px-3 py-3 transition-colors">
                    <LinkIcon size={16} className="text-gray-500" />
                    <input 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://exemplo.com/faq"
                      className="bg-transparent outline-none flex-1 text-sm text-white placeholder:text-neutral-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">A Retell vai ler o conteúdo desta página e aprender com ele.</p>
                </div>
              ) : (
                 <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Título do Documento</label>
                        <input 
                            value={textTitle}
                            onChange={(e) => setTextTitle(e.target.value)}
                            placeholder="Ex: Tabela de Preços 2024"
                            className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Conteúdo / Texto</label>
                        <textarea 
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Cole o texto aqui..."
                            className="w-full h-32 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none"
                        />
                    </div>
                 </div>
              )}

              {/* Botão de Ação */}
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2 transition-all mt-4"
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={18} />}
                {mode === 'url' ? 'Adicionar URL' : 'Salvar Texto'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}