import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializa Supabase com a Service Role Key (para poder gravar sem login de usuário)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // A Retell envia os dados dentro de 'args'
    // call_id vem no nível raiz do objeto geralmente, mas verificamos ambos
    const { appointment_time, customer_name } = body.args;
    const call_id = body.call_id; 

    console.log("⚡ Recebendo agendamento da Retell:", { appointment_time, customer_name, call_id });

    // Inserção no Supabase respeitando EXATAMENTE as colunas do seu print
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          customer_name: customer_name,
          appointment_time: appointment_time, // Coluna correta conforme seu print
          retell_call_id: call_id,            // A coluna nova que mandei criar
          status: 'confirmed',
          // organization_id: ... // Futuramente vamos injetar isso via metadata da chamada
        }
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error);
      throw error;
    }

    console.log("✅ Agendamento salvo com ID:", data[0]?.id);

    // Resposta que o Agente vai ler para saber que deu certo
    return NextResponse.json({
      result: "success",
      message: `Agendamento confirmado para ${appointment_time}.`
    });

  } catch (error) {
    console.error("❌ Erro Crítico na API:", error);
    return NextResponse.json({
      result: "error",
      message: "Falha interna ao acessar a agenda."
    }, { status: 500 });
  }
}