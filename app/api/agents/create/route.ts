import { NextResponse } from 'next/server';
import Retell from 'retell-sdk'; 
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { name, prompt, custom_llm_id } = await request.json();
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID;

    // Se não tiver ORG_ID, avisamos (para não quebrar o banco enterprise)
    if (!ORG_ID) console.warn("Aviso: NEXT_PUBLIC_ORG_ID não configurado.");

    console.log(`🚀 Criando Agente: ${name}`);
    
    let llmIdFinal = custom_llm_id;

    // CENÁRIO A: CRIAÇÃO AUTOMÁTICA (SIMPLES)
    // Se você NÃO colou ID, criamos um cérebro novo básico agora.
    if (!llmIdFinal) {
      console.log("⚡ Nenhum ID fornecido. Criando cérebro básico...");
      const llmResponse = await retell.llm.create({
        model: "gpt-4o-mini",
        general_prompt: prompt || "Você é um assistente virtual útil.",
      });
      llmIdFinal = llmResponse.llm_id;
    } else {
      // CENÁRIO B: CÉREBRO CUSTOMIZADO (MANUAL)
      // Se você colou um ID, usamos ele e ignoramos o prompt do site.
      console.log("🧠 Conectando ao Cérebro Customizado:", llmIdFinal);
    }

    // CRIAR O AGENTE (CORPO)
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

    // SALVAR NO BANCO
    const dbPayload: any = {
        name: name,
        retell_agent_id: agentResponse.agent_id,
        voice_id: agentResponse.voice_id,
        llm_websocket_url: llmIdFinal
    };
    if (ORG_ID) dbPayload.organization_id = ORG_ID;

    await supabase.from('agents').insert([dbPayload]);

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: 'Erro ao criar agente' }, { status: 500 });
  }
}