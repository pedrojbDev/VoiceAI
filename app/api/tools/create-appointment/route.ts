import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🛠️ PAYLOAD RECEBIDO DA RETELL:", JSON.stringify(body, null, 2));

    // A Retell manda os argumentos dentro de 'args'
    const { args, call_id, agent_id } = body; 

    // BLINDAGEM: Se não vier agent_id, usamos um genérico para não travar o banco
    const idDoAgente = agent_id || "agente_desconhecido";

    console.log("Tentando agendar para:", args?.customer_name);

    if (!args || !args.customer_name || !args.appointment_time) {
      return NextResponse.json({ result: "Erro: Faltam dados (Nome ou Horário)." });
    }

    // 2. Salvar no Supabase
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          agent_id: idDoAgente,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone || "Não informado",
          appointment_time: args.appointment_time,
          status: 'confirmed',
          summary: `Agendado via Voz (Call ID: ${call_id})`
        }
      ]);

    if (error) {
      console.error("❌ Erro Supabase:", error);
      return NextResponse.json({ 
        result: "Falha técnica ao salvar no banco de dados." 
      });
    }

    console.log("✅ Agendamento Sucesso!");

    // 3. Resposta Rápida para o Robô
    return NextResponse.json({ 
      result: `Sucesso. Agendamento confirmado para ${args.customer_name} às ${args.appointment_time}.` 
    });

  } catch (error) {
    console.error("❌ Erro Crítico:", error);
    return NextResponse.json({ result: "Erro interno no servidor." }, { status: 500 });
  }
}