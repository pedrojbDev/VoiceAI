import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Usa o cliente básico (sem cookies)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { args, call_id, agent_id } = body; 

    console.log(`🛠️ Tool acionada pelo Agente: ${agent_id}`);

    // --- LÓGICA MULTI-TENANT (O Pulo do Gato) ---
    // 1. Descobrimos de qual empresa é este agente
    const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('organization_id')
        .eq('retell_agent_id', agent_id)
        .single();

    if (agentError || !agentData) {
        console.error("❌ Agente não encontrado no banco:", agent_id);
        return NextResponse.json({ result: "Erro: Agente não identificado no sistema." });
    }

    const ORG_ID = agentData.organization_id;
    console.log(`✅ Agente pertence à Org: ${ORG_ID}`);

    // 2. Salvamos o agendamento na Org correta
    const { error } = await supabase
      .from('appointments')
      .insert([{
          organization_id: ORG_ID, // <--- ID DINÂMICO DESCOBERTO
          agent_id: agent_id,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone || "Não informado",
          appointment_time: args.appointment_time,
          status: 'confirmed',
          summary: `Agendado via Voz (Call ID: ${call_id})`
        }]);

    if (error) {
      console.error("❌ Erro Supabase:", error);
      return NextResponse.json({ result: "Erro técnico ao salvar." });
    }

    return NextResponse.json({ 
      result: `Sucesso. Confirmado para ${args.customer_name} às ${args.appointment_time}.` 
    });

  } catch (error) {
    return NextResponse.json({ result: "Erro interno." }, { status: 500 });
  }
}