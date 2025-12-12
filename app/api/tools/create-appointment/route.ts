import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🛠️ TOOL CALL RECEBIDA:", JSON.stringify(body));

    // 1. EXTRAÇÃO DE DADOS (Blindagem contra formatos diferentes)
    // A Retell manda o agent_id na RAIZ do objeto, não dentro de args.
    const retell_agent_id = body.agent_id; 
    const call_id = body.call_id;
    
    // Os argumentos do agendamento vêm dentro de 'args'
    const { appointment_time, customer_name } = body.args || {};

    // Validação Básica
    if (!retell_agent_id) {
      console.error("❌ ERRO: Retell não enviou o agent_id.");
      return NextResponse.json({ result: "error", message: "Internal Error: Agent ID missing" });
    }

    if (!appointment_time || !customer_name) {
      console.error("❌ ERRO: LLM não enviou data ou nome.", body.args);
      return NextResponse.json({ result: "error", message: "Faltou data ou nome." });
    }

    console.log(`🔍 Buscando Organização para o Agente: ${retell_agent_id}`);

    // 2. LOOKUP DA ORGANIZAÇÃO (O passo crítico)
    // Buscamos na tabela 'agents' para saber qual 'organization_id' usar
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('organization_id')
      .eq('retell_agent_id', retell_agent_id) // Seu banco usa 'retell_agent_id'
      .single();

    if (agentError || !agentData) {
      console.error("⛔ ERRO CRÍTICO: Agente não encontrado no banco.", agentError);
      // Retornamos um erro que o LLM entende
      return NextResponse.json({ 
        result: "error", 
        message: "Erro técnico: Agente não cadastrado no sistema interno." 
      });
    }

    const orgId = agentData.organization_id;
    console.log(`✅ Organização encontrada: ${orgId}`);

    // 3. INSERÇÃO NO BANCO (Usando nomes exatos do seu print image_e53508.png)
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          organization_id: orgId,      // OBRIGATÓRIO (UUID)
          agent_id: retell_agent_id,   // Texto
          customer_name: customer_name,// Texto
          appointment_time: appointment_time, // Texto
          retell_call_id: call_id,     // Texto (Adicionado recentemente)
          status: 'confirmed'          // Texto
        }
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao salvar agendamento:", error);
      throw error;
    }

    console.log("💾 Agendamento Salvo com ID:", data[0]?.id);

    // 4. RESPOSTA PARA O ROBÔ
    return NextResponse.json({
      result: "success",
      message: `Agendamento confirmado com sucesso para ${appointment_time}.`
    });

  } catch (error) {
    console.error("🔥 Crash na API de Agendamento:", error);
    return NextResponse.json({ 
      result: "error", 
      message: "Falha temporária no sistema de agenda." 
    }, { status: 500 });
  }
}