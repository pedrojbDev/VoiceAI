import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin'; // <--- USAR O ADMIN

export async function POST(request: Request) {
  try {
    const event = await request.json();
    
    // Ignora eventos que não sejam análise final
    if (event.event !== 'call_analyzed') {
        return NextResponse.json({ received: true });
    }

    const callData = event.call;
    console.log(`💰 Processando custo da chamada: ${callData.call_id}`);
      
    // 1. Descobre a empresa dona do agente (Usando Admin)
    const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('organization_id')
        .eq('retell_agent_id', callData.agent_id)
        .single();

    if (!agentData) {
        console.error(`❌ Agente ${callData.agent_id} desconhecido. Ignorando webhook.`);
        return NextResponse.json({ received: true });
    }

    const ORG_ID = agentData.organization_id;

    // 2. Prepara os dados
    let custoFinal = 0;
    if (callData.call_cost?.combined_cost) {
        custoFinal = callData.call_cost.combined_cost / 100; // Converte centavos para reais/dólares
    }

    const payload = {
        organization_id: ORG_ID,
        call_id: callData.call_id,
        agent_id: callData.agent_id,
        call_status: callData.call_status,
        start_timestamp: new Date(callData.start_timestamp).toISOString(),
        end_timestamp: new Date(callData.end_timestamp).toISOString(),
        duration_seconds: Math.round(callData.duration_ms / 1000),
        cost: custoFinal,
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        sentiment: callData.call_analysis?.user_sentiment || 'Unknown'
    };

    // 3. Salva no banco (Usando Admin)
    // Primeiro remove duplicata se houver
    await supabaseAdmin.from('calls').delete().eq('call_id', callData.call_id);
    
    const { error } = await supabaseAdmin.from('calls').insert([payload]);

    if (error) console.error("❌ Erro ao salvar call:", error);
    else console.log(`✅ Call salva com sucesso na Org: ${ORG_ID}`);

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error("Erro Webhook:", err);
    return NextResponse.json({ error: 'Webhook falhou' }, { status: 500 });
  }
}