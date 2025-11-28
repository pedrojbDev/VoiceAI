import { NextResponse } from 'next/server';
import Retell from 'retell-sdk'; 
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { name, prompt, use_scheduler } = await request.json();
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID; // Pega do env

    if (!ORG_ID) throw new Error("Organization ID não configurado no .env");

    console.log(`🚀 Criando Agente na Org ${ORG_ID}: ${name}`);

    // 1. Definição da Ferramenta
    const toolAgendamento = {
      type: "custom",
      name: "book_appointment",
      description: "Ferramenta para salvar agendamento. Use OBRIGATORIAMENTE ao confirmar horário.",
      url: "https://voice-ai-drab.vercel.app/api/tools/create-appointment", 
      speak_during_execution: true,
      execution_message_description: "Um momento, estou confirmando na agenda...",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Nome do paciente" },
          appointment_time: { type: "string", description: "Data e hora desejada (ex: Amanhã às 14h)" }
        },
        required: ["customer_name", "appointment_time"]
      }
    };

    // 2. Montagem do Prompt
    let finalPrompt = prompt || "Você é um assistente virtual útil.";
    let toolsList = [];

    if (use_scheduler) {
      finalPrompt += `
      ### REGRAS DE SISTEMA (AGENDAMENTO):
      1. Você possui a ferramenta "book_appointment".
      2. Colete Nome e Horário.
      3. OBRIGATÓRIO: Chame a ferramenta para confirmar. Não minta.
      `;
      toolsList.push(toolAgendamento);
    }

    // 3. Criar LLM (Raw API)
    const responseLLM = await fetch("https://api.retellai.com/create-retell-llm", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        general_prompt: finalPrompt,
        tools: toolsList.length > 0 ? toolsList : undefined
      })
    });

    if (!responseLLM.ok) {
      const txt = await responseLLM.text();
      throw new Error(`Erro Retell LLM: ${txt}`);
    }
    const llmData = await responseLLM.json();

    // 4. Criar Agente
    const agentResponse = await retell.agent.create({
      agent_name: name,
      voice_id: "custom_voice_28c8f2fedde9cae4cee5c080a0",
      response_engine: { llm_id: llmData.llm_id, type: "retell-llm" },
      language: "pt-BR",
      voice_temperature: 0.8,
      interruption_sensitivity: 0.5, 
      
    });

    // 5. Salvar no Banco (COM ORG_ID)
    const { error } = await supabase.from('agents').insert([{
        name: name,
        retell_agent_id: agentResponse.agent_id,
        voice_id: agentResponse.voice_id,
        llm_websocket_url: llmData.llm_id,
        organization_id: ORG_ID // <--- O MÁGICO
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: 'Erro ao criar agente' }, { status: 500 });
  }
}