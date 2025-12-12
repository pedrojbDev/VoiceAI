import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, call } = body;

    if (event === 'call_analyzed') {
      const cleanAgentId = call.agent_id?.trim();
      console.log(`📞 Webhook: Analisando chamada do agente '${cleanAgentId}'`);

      // 1. Busca Dinâmica (Lookup)
      const { data: agentData, error: searchError } = await supabase
        .from('agents')
        .select('organization_id')
        .eq('retell_agent_id', cleanAgentId)
        .single();

      if (!agentData) {
        console.error(`⛔ ERRO FATAL: Agente '${cleanAgentId}' não encontrado no banco.`);
        // Aqui retornamos 200 para a Retell não ficar tentando reenviar, 
        // mas logamos o erro para você corrigir o cadastro.
        return NextResponse.json({ received: true, status: "agent_missing_in_db" });
      }

      // 2. Persistência
      const { error } = await supabase.from('calls').upsert({
        call_id: call.call_id,
        organization_id: agentData.organization_id, // Vínculo real
        agent_id: cleanAgentId,
        call_status: call.call_status,
        start_timestamp: new Date(call.start_timestamp).toISOString(),
        end_timestamp: new Date(call.end_timestamp).toISOString(),
        duration_seconds: Math.round(call.duration_ms / 1000),
        cost: call.cost_metadata?.total_cost,
        recording_url: call.recording_url,
        transcript: call.transcript,
        sentiment: call.call_analysis?.user_sentiment
      }, { onConflict: 'call_id' });

      if (error) {
        console.error("❌ Erro ao salvar Call:", error);
      } else {
        console.log("✅ Call registrada com sucesso para a Org:", agentData.organization_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}