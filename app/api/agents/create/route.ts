import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { name, prompt } = await request.json();

    console.log("🚀 Criando Agente Executivo com Ferramentas...");

    // 1. Configurar o Cérebro (LLM) com a Ferramenta de Agendamento
    // O GPT-4o é fundamental aqui para entender QUANDO chamar a função
    const llmResponse = await retell.llm.create({
      model: "gpt-4o",
      general_prompt: prompt || "Você é um assistente útil e fala português do Brasil.",
      tools: [
        {
          type: "custom",
          name: "book_appointment",
          description: "Use esta ferramenta OBRIGATORIAMENTE quando o usuário confirmar o horário e quiser agendar. Não apenas diga que agendou, execute esta ação.",
          
          // --- URL DE PRODUÇÃO DA VERCEL ---
          url: "https://voice-ai-drab.vercel.app/api/tools/create-appointment",
          
          speak_during_execution: true, // O robô avisa que está processando
          speak_after_execution: false, // Deixa o LLM decidir o que falar depois com base no resultado da API
          execution_message_description: "Só um instante, estou confirmando na agenda...",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string", description: "Nome do paciente" },
              appointment_time: { type: "string", description: "Data e hora desejada (ex: Segunda as 14h)" },
              customer_phone: { type: "string", description: "Telefone de contato, se informado" }
            },
            required: ["customer_name", "appointment_time"]
          }
        }
      ]
    } as any);

    // 2. Criar o Corpo (Agente)
    const agentResponse = await retell.agent.create({
      agent_name: name,
      // Voz Brasileira da Thais (Customizada)
      voice_id: "custom_voice_28c8f2fedde9cae4cee5c080a0", 
      response_engine: { 
        llm_id: llmResponse.llm_id,
        type: "retell-llm"
      },
      language: "pt-BR",
      
      // Configurações de Estabilidade
      voice_temperature: 0.8,
      interruption_sensitivity: 0.5, 
      enable_backchanneling: false,
    } as any);

    // 3. Salvar no Banco
    const { error } = await supabase
      .from('agents')
      .insert([{
          name: name,
          retell_agent_id: agentResponse.agent_id,
          voice_id: agentResponse.voice_id,
          llm_websocket_url: llmResponse.llm_id 
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: 'Erro ao criar agente com tools' }, { status: 500 });
  }
}