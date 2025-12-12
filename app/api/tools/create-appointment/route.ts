import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicialização com Chave Mestra (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 [Payload Recebido]:", JSON.stringify(body));

    // 1. EXTRAÇÃO E LIMPEZA DOS DADOS
    // Retell pode mandar o agent_id na raiz ou dentro de args, dependendo da versão
    const rawAgentId = body.agent_id || body.args?.agent_id;
    const call_id = body.call_id || body.args?.call_id;
    const { appointment_time, customer_name } = body.args || body;

    if (!rawAgentId) {
      console.error("❌ Erro: Agent ID não fornecido pela Retell.");
      return NextResponse.json({ result: "error", message: "Agent ID missing" }, { status: 400 });
    }

    // Removemos espaços invisíveis que podem quebrar a busca
    const cleanAgentId = rawAgentId.trim();

    console.log(`🔍 Buscando no banco o Agente: '${cleanAgentId}'`);

    // 2. BUSCA DINÂMICA DA ORGANIZAÇÃO (Onde estava o erro)
    const { data: agentData, error: searchError } = await supabase
      .from('agents')
      .select('organization_id')
      .eq('retell_agent_id', cleanAgentId)
      .single();

    // Diagnóstico detalhado caso falhe
    if (searchError || !agentData) {
      console.error("⛔ FALHA DE VÍNCULO:");
      console.error(`   - Busquei por: '${cleanAgentId}'`);
      console.error(`   - Erro do Banco:`, searchError?.message);
      console.error(`   - Resultado:`, agentData);
      
      return NextResponse.json({ 
        result: "error", 
        message: "Erro interno: Agente não reconhecido no sistema. Verifique o cadastro." 
      });
    }

    console.log(`✅ Agente localizado! Pertence à Org: ${agentData.organization_id}`);

    // 3. INSERÇÃO SEGURA (Com Organization ID validado)
    const { data, error: insertError } = await supabase
      .from('appointments')
      .insert([
        {
          organization_id: agentData.organization_id, // Vínculo dinâmico correto
          agent_id: cleanAgentId,
          customer_name: customer_name,
          appointment_time: appointment_time,
          retell_call_id: call_id,
          status: 'confirmed'
        }
      ])
      .select();

    if (insertError) {
      console.error("❌ Erro ao salvar agendamento:", insertError);
      throw insertError;
    }

    console.log("💾 Agendamento salvo com ID:", data[0]?.id);

    return NextResponse.json({
      result: "success",
      message: `Agendamento confirmado para ${appointment_time}.`
    });

  } catch (error) {
    console.error("🔥 Erro Crítico na API:", error);
    return NextResponse.json({ result: "error", message: "Falha no servidor." }, { status: 500 });
  }
}