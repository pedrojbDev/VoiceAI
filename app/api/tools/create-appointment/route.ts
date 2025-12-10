import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin'; // <--- USAR O ADMIN

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { args, call_id, agent_id } = body; 

    console.log(`🛠️ Agendamento solicitado pelo Agente: ${agent_id}`);

    // 1. Busca segura com Chave Mestra (Bypassa o RLS)
    const { data: agentData, error: agentError } = await supabaseAdmin
        .from('agents')
        .select('organization_id')
        .eq('retell_agent_id', agent_id)
        .single();

    if (agentError || !agentData) {
        console.error("❌ Agente não encontrado (Erro DB):", agentError);
        return NextResponse.json({ result: "Erro: Agente não identificado no sistema." });
    }

    const ORG_ID = agentData.organization_id;

    // 2. Salva o agendamento
    const { error } = await supabaseAdmin
      .from('appointments')
      .insert([{
          organization_id: ORG_ID,
          agent_id: agent_id,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone || "Não informado",
          appointment_time: args.appointment_time,
          status: 'confirmed',
          summary: `Agendado via Voz (Call ID: ${call_id})`
        }]);

    if (error) {
      console.error("❌ Erro ao salvar agendamento:", error);
      return NextResponse.json({ result: "Erro técnico ao salvar." });
    }

    return NextResponse.json({ 
      result: `Sucesso. Confirmado para ${args.customer_name} às ${args.appointment_time}.` 
    });

  } catch (error) {
    return NextResponse.json({ result: "Erro interno." }, { status: 500 });
  }
}