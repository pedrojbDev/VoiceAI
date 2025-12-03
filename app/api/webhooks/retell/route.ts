import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Cliente básico

export async function POST(request: Request) {
  try {
    const event = await request.json();
    console.log(`🔔 Webhook: ${event.event}`);

    if (event.event === 'call_analyzed' || event.event === 'call_ended') {
      const callData = event.call;
      
      // --- LÓGICA MULTI-TENANT ---
      // Descobre a empresa dona do agente
      const { data: agentData } = await supabase
        .from('agents')
        .select('organization_id')
        .eq('retell_agent_id', callData.agent_id)
        .single();

      // Se não achou o agente no banco, usa um fallback ou loga erro
      // (Isso evita que chamadas de testes antigos quebrem o webhook)
      if (!agentData) {
          console.error(`❌ Agente ${callData.agent_id} não tem dono no banco. Ignorando.`);
          return NextResponse.json({ received: true });
      }

      const ORG_ID = agentData.organization_id;

      // --- CÁLCULO ---
      let custoFinal = 0;
      if (callData.call_cost?.combined_cost) {
        custoFinal = callData.call_cost.combined_cost / 100;
      }

      const payload = {
        organization_id: ORG_ID, // <--- ID CORRETO
        call_id: callData.call_id,
        agent_id: callData.agent_id,
        call_status: callData.call_status,
        start_timestamp: new Date(callData.start_timestamp).toISOString(),
        end_timestamp: new Date(callData.end_timestamp).toISOString(),
        duration_seconds: Math.round(callData.duration_ms / 1000),
        ...(custoFinal > 0 && { cost: custoFinal }),
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        sentiment: callData.call_analysis?.user_sentiment || 'Unknown'
      };

      // Delete + Insert (Strategy)
      await supabase.from('calls').delete().eq('call_id', callData.call_id);
      
      const { error } = await supabase.from('calls').insert([payload]);

      if (error) console.error("❌ Erro ao salvar call:", error);
      else console.log(`✅ Call salva na Org ${ORG_ID}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook falhou' }, { status: 500 });
  }
}