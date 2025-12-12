import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🛠️ TOOL CALL RECEBIDA (Payload Bruto):", JSON.stringify(body));

    // --- CORREÇÃO DE EXTRAÇÃO (AQUI ESTAVA O ERRO) ---
    // Tentamos pegar na raiz. Se não tiver, pegamos dentro do objeto 'call'.
    const retell_agent_id = body.agent_id || body.call?.agent_id;
    const call_id = body.call_id || body.call?.call_id;
    
    // Argumentos geralmente vêm na raiz 'args' ou 'arguments'
    const args = body.args || body.arguments || {};
    const { appointment_time, customer_name } = args;

    // --- FIM DA CORREÇÃO ---

    // Validação
    if (!retell_agent_id) {
      console.error("❌ ERRO FATAL: Não consegui encontrar o agent_id no JSON.");
      // Dica para debug: Se cair aqui, o log do payload bruto acima vai nos salvar
      return NextResponse.json({ result: "error", message: "Agent ID missing in payload" });
    }

    if (!appointment_time || !customer_name) {
      console.error("❌ ERRO: Faltam parâmetros (nome ou hora).", args);
      return NextResponse.json({ result: "error", message: "Por favor, forneça nome e horário." });
    }

    console.log(`🔍 Buscando Organização para o Agente: ${retell_agent_id}`);

    // 2. LOOKUP DA ORGANIZAÇÃO
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('organization_id')
      .eq('retell_agent_id', retell_agent_id)
      .single();

    if (agentError || !agentData) {
      console.error("⛔ ERRO CRÍTICO: Agente não encontrado no banco.", agentError);
      return NextResponse.json({ 
        result: "error", 
        message: "Erro técnico: Agente não vinculado." 
      });
    }

    const orgId = agentData.organization_id;
    console.log(`✅ Organização encontrada: ${orgId}`);

    // 3. INSERÇÃO NO BANCO
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          organization_id: orgId,
          agent_id: retell_agent_id,
          customer_name: customer_name,
          appointment_time: appointment_time,
          retell_call_id: call_id,
          status: 'confirmed'
        }
      ])
      .select();

    if (error) {
      console.error("❌ Erro Supabase:", error);
      throw error;
    }

    console.log("💾 Agendamento Salvo! ID:", data[0]?.id);

    return NextResponse.json({
      result: "success",
      message: `Agendamento confirmado para ${appointment_time}.`
    });

  } catch (error) {
    console.error("🔥 Crash API:", error);
    return NextResponse.json({ result: "error", message: "Falha no servidor." }, { status: 500 });
  }
}