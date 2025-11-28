import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { name, prompt } = await request.json();

    console.log("🚀 Criando Agente V5 (Fábrica Automática)...");

    const promptReforcado = `
    ${prompt}
    
    ### REGRAS CRÍTICAS DE FERRAMENTAS (SISTEMA):
    1. Você POSSUI uma ferramenta chamada "book_appointment".
    2. Quando o usuário fornecer Nome e Horário, você É OBRIGADO a usar essa ferramenta.
    3. NÃO RESPONDA que agendou se você não tiver visto a mensagem de sucesso da ferramenta.
    4. Se você apenas falar "Agendei" sem usar a ferramenta, você falhou na sua missão.
    5. Fique mudo ou diga "Um momento..." enquanto a ferramenta roda.
    `;

    // 1. Configurar o Cérebro (LLM)
    const llmResponse = await retell.llm.create({
      model: "gpt-4o",
      general_prompt: promptReforcado,
      tools: [
        {
          type: "custom",
          name: "book_appointment",
          description: "FERRAMENTA OBRIGATÓRIA. Use para salvar o agendamento no banco de dados.",
          url: "https://voice-ai-drab.vercel.app/api/tools/create-appointment", 
          speak_during_execution: true,
          speak_after_execution: false,
          execution_message_description: "Só um segundo, estou registrando no sistema...",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string", description: "Nome do paciente identificado na conversa" },
              appointment_time: { type: "string", description: "Data e hora desejada (ex: Amanhã às 14h)" }
              // REMOVI O TELEFONE DAQUI PARA NÃO TRAVAR O ROBÔ NA WEB CALL
            },
            required: ["customer_name", "appointment_time"]
          }
        }
      ]
    } as any);

    // 2. Criar o Corpo (Agente)
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
      enable_backchanneling: false,
    } as any);

    // 3. Salvar no Banco
    await supabase.from('agents').insert([{
        name: name,
        retell_agent_id: agentResponse.agent_id,
        voice_id: agentResponse.voice_id,
        llm_websocket_url: llmResponse.llm_id 
    }]);

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: 'Erro ao criar agente' }, { status: 500 });
  }
}