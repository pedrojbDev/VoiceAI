import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

// Força o ambiente Node.js para evitar instabilidades de rede
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { agentId, knowledgeBaseId } = await req.json();

    // 1. Validação de Input
    if (!agentId || !knowledgeBaseId) {
      return NextResponse.json({ error: "IDs do Agente e da Base são obrigatórios" }, { status: 400 });
    }

    // 2. Validação da API Key (Resolve o erro 'string | undefined')
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      console.error("❌ ERRO: RETELL_API_KEY ausente.");
      return NextResponse.json({ error: "Configuração de servidor inválida" }, { status: 500 });
    }

    const client = new Retell({ apiKey });

    console.log(`🔍 Buscando agente ${agentId} para identificar o LLM...`);

    // 3. Busca o Agente para descobrir qual LLM ele usa
    const agent = await client.agent.retrieve(agentId);
    
    // O SDK v4 retorna o ID do LLM dentro de 'response_engine'
    // Usamos 'as any' temporariamente para evitar brigas com tipagens antigas/novas
    const llmId = (agent as any).response_engine?.llm_id || (agent as any).llm_id;

    if (!llmId) {
      return NextResponse.json({ 
        error: "Erro Crítico: Este agente não tem um LLM vinculado. Crie um agente novo usando a Dashboard da Retell primeiro." 
      }, { status: 400 });
    }

    console.log(`🧠 Atualizando LLM (${llmId}) para usar a Base [${knowledgeBaseId}]...`);

    // 4. A CORREÇÃO MÁGICA (Plural e Array)
    const llmUpdate = await client.llm.update(llmId, {
      knowledge_base_ids: [knowledgeBaseId] // <-- AQUI MUDOU DE 'id' PARA 'ids' (Array)
    });

    console.log("✅ Vínculo realizado com sucesso!");

    return NextResponse.json(llmUpdate, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro ao vincular KB:", error);
    return NextResponse.json({ 
      error: error.message || "Falha ao atualizar agente",
      details: error?.response?.data || "Sem detalhes"
    }, { status: 500 });
  }
}