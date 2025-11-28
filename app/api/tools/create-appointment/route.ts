import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Esta rota será chamada pela Retell AI (pelo robô)
export async function POST(request: Request) {
  try {
    // 1. O robô nos manda os dados que extraiu da conversa
    const body = await request.json();
    const { agent_id, args } = body; 
    // 'args' são os argumentos que o robô capturou (nome, horário, telefone)
    
    console.log("🛠️ Ferramenta Acionada:", args);

    // 2. Salvar no Supabase
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          agent_id: agent_id,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone, // O robô tentará extrair ou pedirá
          appointment_time: args.appointment_time,
          status: 'confirmed',
          summary: `Agendado via Voz. Paciente: ${args.customer_name}`
        }
      ]);

    if (error) {
      console.error("Erro ao agendar:", error);
      // Retornamos um erro para o robô saber que falhou
      return NextResponse.json({ 
        result: "Falha ao acessar o sistema de agenda. Peça para tentar mais tarde." 
      });
    }

    // 3. Resposta para o Robô (O que ele vai "ler" para saber que deu certo)
    return NextResponse.json({ 
      result: `Sucesso. Agendamento confirmado para ${args.customer_name} às ${args.appointment_time}. Diga ao cliente que está tudo certo.` 
    });

  } catch (error) {
    return NextResponse.json({ result: "Erro interno no servidor." }, { status: 500 });
  }
}