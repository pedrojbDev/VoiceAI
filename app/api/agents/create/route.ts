import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { name, prompt } = await request.json();

    console.log("1. Configurando voz Thais (Custom)...");

    // --- AQUI ESTÁ A VOZ QUE VOCÊ ESCOLHEU ---
    const VOICE_ID_ESCOLHIDO = "custom_voice_28c8f2fedde9cae4cee5c080a0"; 

    // 2. Criar o Cérebro (LLM)
    const llmResponse = await retell.llm.create({
      model: "gpt-4o-mini",
      // O prompt define a personalidade
      general_prompt: prompt || "Você é um assistente útil e fala português do Brasil.",
    });

    // 3. Criar o Agente
    const agentResponse = await retell.agent.create({
      agent_name: name,
      voice_id: VOICE_ID_ESCOLHIDO, 
      response_engine: { 
        llm_id: llmResponse.llm_id,
        type: "retell-llm"
      },
      language: "pt-BR", // Garante que a Retell otimize a latência para Português
      // --- CONFIGURAÇÕES DE LATÊNCIA E INTERRUPÇÃO ---
      voice_temperature: 0.8,
      
      // O PADRÃO É 1.0 (Muito sensível). 
      // 0.5 a 0.7 deixa ela mais "firme" na fala inicial, ignorando ruídos do mic.
      interruption_sensitivity: 0.5, 
      
      
      
    });

    // 4. Salvar no Banco
    const { data, error } = await supabase
      .from('agents')
      .insert([{
          name: name,
          retell_agent_id: agentResponse.agent_id,
          voice_id: agentResponse.voice_id,
          llm_websocket_url: llmResponse.llm_id 
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, agent_id: agentResponse.agent_id });

  } catch (error) {
    console.error('ERRO:', error);
    return NextResponse.json({ error: 'Erro ao criar' }, { status: 500 });
  }
}