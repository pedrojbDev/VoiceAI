import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { args, call_id, agent_id } = body; 
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID; // Pega do env

    console.log("🛠️ Agendando para Org:", ORG_ID);

    if (!args || !args.customer_name || !args.appointment_time) {
      return NextResponse.json({ result: "Erro: Faltam dados." });
    }

    // Salvar (COM ORG_ID)
    const { error } = await supabase
      .from('appointments')
      .insert([{
          organization_id: ORG_ID, // <--- VÍNCULO EMPRESARIAL
          agent_id: agent_id || "unknown",
          customer_name: args.customer_name,
          customer_phone: args.customer_phone || "Não informado",
          appointment_time: args.appointment_time,
          status: 'confirmed',
          summary: `Agendado via Voz (Call ID: ${call_id})`
        }]);

    if (error) {
      console.error("❌ Erro Supabase:", error);
      return NextResponse.json({ result: "Erro técnico no banco." });
    }

    return NextResponse.json({ 
      result: `Sucesso. Confirmado para ${args.customer_name} às ${args.appointment_time}.` 
    });

  } catch (error) {
    return NextResponse.json({ result: "Erro interno." }, { status: 500 });
  }
}