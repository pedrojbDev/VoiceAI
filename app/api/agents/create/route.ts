import { NextResponse } from 'next/server';
import Retell from 'retell-sdk'; 
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { name, prompt } = await request.json();

    console.log("🚀 Criando Agente V6 (API V2 Raw)...");

    // --- PASSO 1: CRIAR O CÉREBRO (LLM) USANDO A API V2 ---
    // A versão V2 garante melhor compatibilidade com as ferramentas
    const llmResponseRaw = await fetch("https://api.retellai.com/v2/create-retell-llm", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        general_prompt: prompt,
        tools: [
          {
            type: "custom",
            name: "book_appointment",
            description: "Ferramenta para agendar consultas. Use sempre que o usuário confirmar o horário.",
            url: "https://voice-ai-drab.vercel.app/api/tools/create-appointment", 
            speak_during_execution: true,
            execution_message_description: "Só um instante, estou verificando a agenda...",
            parameters: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Nome do paciente" },
                appointment_time: { type: "string", description: "Data e hora desejada (ex: Amanhã às 14h)" }
              },
              required: ["customer_name", "appointment_time"]
            }
          }
        ]
      })
    });

    if (!llmResponseRaw.ok) {
      const errorData = await llmResponseRaw.text();
      throw new Error(`Erro Retell V2: ${errorData}`);
    }

    const llmResponse = await llmResponseRaw.json();
    console.log("✅ LLM V2 Criado. ID:", llmResponse.llm_id);

    // --- PASSO 2: CRIAR O CORPO (AGENTE) ---
    const agentResponse = await retell.agent.create({
      agent_name: name,
      voice_id: "custom_voice_28c8f2fedde9cae4cee5c080a0", // Voz Thais
      response_engine: { 
        llm_id: llmResponse.llm_id,
        type: "retell-llm"
      },
      language: "pt-BR",
      voice_temperature: 0.8,
      interruption_sensitivity: 0.5, 
    });

    // --- PASSO 3: SALVAR NO BANCO ---
    await supabase.from('agents').insert([{
        name: name,
        retell_agent_id: agentResponse.agent_id,
        voice_id: agentResponse.voice_id,
        llm_websocket_url: llmResponse.llm_id 
    }]);

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO FATAL:', error);
    return NextResponse.json({ error: 'Erro ao criar agente', details: String(error) }, { status: 500 });
  }
}