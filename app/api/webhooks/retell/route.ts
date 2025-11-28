import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Webhooks são POST por padrão
export async function POST(request: Request) {
  try {
    const event = await request.json();

    // Log para você ver na Vercel o que está chegando
    console.log("🔔 Webhook Recebido:", event.event);

    // Só nos interessa quando a chamada ACABA (para pegar custo e duração final)
    if (event.event === 'call_ended') {
      const callData = event.call;

      // Monta o objeto para salvar no banco
      const payload = {
        call_id: callData.call_id,
        agent_id: callData.agent_id,
        call_status: callData.call_status,
        start_timestamp: new Date(callData.start_timestamp).toISOString(),
        end_timestamp: new Date(callData.end_timestamp).toISOString(),
        // A Retell manda duração em milissegundos, convertemos para segundos
        duration_seconds: Math.round(callData.duration_ms / 1000),
        // O custo vem calculado ou 0
        cost: callData.cost_metadata?.total_cost || 0,
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        // Análise de sentimento (se configurado no agente)
        sentiment: callData.call_analysis?.user_sentiment || 'Unknown'
      };

      // Salva no Supabase
      const { error } = await supabase
        .from('calls')
        .upsert(payload, { onConflict: 'call_id' }); // Upsert evita duplicidade

      if (error) {
        console.error("Erro ao salvar no Supabase:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log("✅ Chamada salva com sucesso:", payload.call_id);
    }

    // Retorna 200 OK para a Retell saber que recebemos (se não ela fica tentando reenviar)
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error("Erro no Webhook:", err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}