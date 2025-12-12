import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, organization_id } = body;

    console.log(`🧠 Iniciando criação da KB: "${name}" para Org: ${organization_id}`);

    // 1. Verificação de Segurança da SDK
    if (!retell.knowledgeBase) {
      console.error("❌ ERRO CRÍTICO: Sua versão do 'retell-sdk' está desatualizada e não tem suporte a Knowledge Base.");
      console.error("💡 SOLUÇÃO: Rode 'npm install retell-sdk@latest' no terminal.");
      return NextResponse.json({ 
        error: "SDK Desatualizada. Atualize o retell-sdk." 
      }, { status: 500 });
    }

    // 2. Criação na Retell AI
    console.log("📡 Enviando requisição para Retell...");
    
    const kbResponse = await retell.knowledgeBase.create({
      knowledge_base_name: name,
      enable_auto_refresh: true
    });

    console.log("✅ Sucesso na Retell! ID:", kbResponse.knowledge_base_id);

    // 3. Salva no Supabase
    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert([
        {
          name: name,
          retell_kb_id: kbResponse.knowledge_base_id,
          organization_id: organization_id,
          status: 'ready'
        }
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error);
      throw error;
    }

    return NextResponse.json(data[0]);

  } catch (error: any) {
    // Log detalhado do erro para sabermos o que aconteceu
    console.error("🔥 FALHA FATAL NA API:", error);
    
    // Retorna o erro para o frontend parar de carregar
    return NextResponse.json({ 
      error: error.message || "Erro desconhecido ao criar KB" 
    }, { status: 500 });
  }
}