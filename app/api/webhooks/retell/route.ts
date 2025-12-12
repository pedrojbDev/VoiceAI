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
      console.log("📞 Processando chamada:", call.call_id);

      // 1. BUSCAR A ORGANIZAÇÃO (Lookup)
      // Precisamos saber de quem é essa chamada baseada no agente que atendeu
      const { data: agentData } = await supabase
        .from('agents')
        .select('organization_id')
        .eq('retell_agent_id', call.agent_id)
        .single();

      if (!agentData) {
        console.error("⚠️ Chamada recebida de agente desconhecido:", call.agent_id);
        // Opcional: Salvar em log de erro ou ignorar
        return NextResponse.json({ received: true, status: "agent_not_found" });
      }

      // 2. SALVAR NA TABELA CALLS
      // Mapeando para sua tabela
      const { error } = await supabase.from('calls').upsert({
        call_id: call.call_id,
        agent_id: call.agent_id,
        organization_id: agentData.organization_id, // <--- A CORREÇÃO CRÍTICA
        call_status: call.call_status,
        start_timestamp: new Date(call.start_timestamp).toISOString(),
        end_timestamp: new Date(call.end_timestamp).toISOString(),
        duration_seconds: Math.round(call.duration_ms / 1000),
        cost: call.cost_metadata?.total_cost, // Verifique se a Retell manda assim ou ajuste
        recording_url: call.recording_url,
        transcript: call.transcript,
        sentiment: call.call_analysis?.user_sentiment, // Mapeando sentimento
      }, { onConflict: 'call_id' });

      if (error) {
        console.error("❌ Erro ao salvar Call:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Fatal Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}