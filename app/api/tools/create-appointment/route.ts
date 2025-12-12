import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🛠️ Tentativa de Agendamento:", JSON.stringify(body));

    const { appointment_time, customer_name } = body.args;
    const call_id = body.call_id;
    const retell_agent_id = body.agent_id; // Retell sempre manda o ID do agente

    // 1. O PASSO QUE FALTAVA: Descobrir a Organização dona desse Agente
    // Consultamos sua tabela 'agents'
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('organization_id')
      .eq('retell_agent_id', retell_agent_id)
      .single();

    if (agentError || !agentData) {
      console.error("❌ Agente não encontrado no banco local:", retell_agent_id);
      return NextResponse.json({ result: "error", message: "Agente não vinculado." });
    }

    const orgId = agentData.organization_id; // Recuperamos o UUID da organização

    // 2. Inserir o agendamento COM o organization_id obrigatório
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          organization_id: orgId, // <--- A CORREÇÃO CRÍTICA
          agent_id: retell_agent_id,
          customer_name: customer_name,
          appointment_time: appointment_time,
          retell_call_id: call_id,
          status: 'confirmed'
        }
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao gravar agendamento:", error);
      throw error;
    }

    return NextResponse.json({
      result: "success",
      message: `Agendamento confirmado para ${appointment_time}.`
    });

  } catch (error) {
    console.error("❌ Crash API:", error);
    return NextResponse.json({ result: "error", message: "Erro interno." }, { status: 500 });
  }
}