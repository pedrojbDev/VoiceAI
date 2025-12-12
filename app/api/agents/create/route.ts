import { NextResponse } from 'next/server';
import Retell from 'retell-sdk'; 
import { createClient } from '@/utils/supabase/server'; // <--- IMPORTAÇÃO CORRETA PARA AUTH

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    // 1. Inicializa o Supabase com contexto de segurança (Cookies)
    const supabase = await createClient(); // <--- O AWAIT QUE FALTAVA

    // 2. Verifica quem está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não logado' }, { status: 401 });
    }

    // 3. Busca a Organização desse usuário (Multi-tenant Real)
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const ORG_ID = profile?.organization_id;

    if (!ORG_ID) {
      return NextResponse.json({ error: 'Usuário sem organização vinculada' }, { status: 400 });
    }

    // 4. Recebe os dados do Frontend
    const { name, prompt, custom_llm_id } = await request.json();

    console.log(`🚀 Criando Agente: ${name} na Org: ${ORG_ID}`);
    
    let llmIdFinal = custom_llm_id;

    // --- LÓGICA RETELL (CÉREBRO) ---
    
    // CENÁRIO A: CRIAÇÃO AUTOMÁTICA (SIMPLES)
    // Se você NÃO colou ID, criamos um cérebro novo básico agora.
    if (!llmIdFinal) {
      console.log("⚡ Nenhum ID fornecido. Criando cérebro básico...");
      const llmResponse = await retell.llm.create({
        model: "gpt-4o-mini" as any,
        general_prompt: prompt || "Você é um assistente virtual útil.",
      });
      llmIdFinal = llmResponse.llm_id;
    } else {
      // CENÁRIO B: CÉREBRO CUSTOMIZADO (MANUAL)
      // Se você colou um ID, usamos ele e ignoramos o prompt do site.
      console.log("🧠 Conectando ao Cérebro Customizado:", llmIdFinal);
    }

    // --- CRIAR O AGENTE (CORPO) ---
    // Conectamos ao cérebro decidido acima (seja novo ou custom)
    const agentResponse = await retell.agent.create({
      agent_name: name,
      voice_id: "custom_voice_28c8f2fedde9cae4cee5c080a0", // Voz Thais
      response_engine: { 
        llm_id: llmIdFinal, 
        type: "retell-llm"
      },
      language: "pt-BR",
      voice_temperature: 0.8,
      interruption_sensitivity: 0.5,
    });

    // --- SALVAR NO BANCO ---
    // Agora usamos o ORG_ID dinâmico que pegamos do perfil do usuário
    const { error: dbError } = await supabase.from('agents').insert([{
        name: name,
        retell_agent_id: agentResponse.agent_id,
        voice_id: agentResponse.voice_id,
        llm_websocket_url: llmIdFinal,
        organization_id: ORG_ID // <--- VÍNCULO CORRETO
    }]);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: 'Erro ao criar agente', details: String(error) }, { status: 500 });
  }
}