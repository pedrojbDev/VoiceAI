import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const event = await request.json();

    // --- O ESPIÃO ---
    // Isso vai imprimir o JSON completo nos logs da Vercel
    console.log("🔍 WEBHOOK CHEGOU:", JSON.stringify(event, null, 2));

    if (event.event === 'call_ended') {
      const callData = event.call;

      // Log específico para ver a estrutura de custo
      console.log("💰 DADOS DE CUSTO:", JSON.stringify(callData.cost_metadata, null, 2));

      // Tenta pegar o custo de vários lugares possíveis (Blindagem)
      const custoFinal = 
        callData.cost_metadata?.total_cost || 
        callData.cost || 
        0;

      const payload = {
        call_id: callData.call_id,
        agent_id: callData.agent_id,
        call_status: callData.call_status,
        start_timestamp: new Date(callData.start_timestamp).toISOString(),
        end_timestamp: new Date(callData.end_timestamp).toISOString(),
        duration_seconds: Math.round(callData.duration_ms / 1000),
        cost: custoFinal, // Usa a variável blindada
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        sentiment: callData.call_analysis?.user_sentiment || 'Unknown'
      };

      const { error } = await supabase
        .from('calls')
        .upsert(payload, { onConflict: 'call_id' });

      if (error) {
        console.error("❌ Erro Supabase:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log("✅ Salvo no Banco. Custo registrado:", custoFinal);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error("❌ Erro Crítico:", err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}