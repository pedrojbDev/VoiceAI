import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const event = await request.json();
    console.log(`🔔 Evento Recebido: ${event.event}`);

    // Aceitamos 'call_analyzed' porque é ele que traz o Custo e a Análise de Sentimento
    // Aceitamos 'call_ended' para garantir que salvamos logo que desliga (mesmo sem custo ainda)
    if (event.event === 'call_analyzed' || event.event === 'call_ended') {
      const callData = event.call;

      // 1. Tenta pegar o custo (vem em call_analyzed)
      // O valor vem em CENTAVOS (ex: 8.86), dividimos por 100 para virar DÓLARES (0.0886)
      let custoFinal = 0;
      if (callData.call_cost?.combined_cost) {
        custoFinal = callData.call_cost.combined_cost / 100;
      }

      // 2. Monta o pacote para o banco
      const payload = {
        call_id: callData.call_id,
        agent_id: callData.agent_id,
        call_status: callData.call_status,
        start_timestamp: new Date(callData.start_timestamp).toISOString(),
        end_timestamp: new Date(callData.end_timestamp).toISOString(),
        duration_seconds: Math.round(callData.duration_ms / 1000),
        
        // Só atualiza o custo se ele for maior que 0 (para não zerar se vier um call_ended atrasado)
        ...(custoFinal > 0 && { cost: custoFinal }),
        
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        sentiment: callData.call_analysis?.user_sentiment || 'Unknown'
      };

      // 3. Salva no Supabase (Upsert atualiza se já existir)
      const { error } = await supabase
        .from('calls')
        .upsert(payload, { onConflict: 'call_id' });

      if (error) {
        console.error("❌ Erro ao salvar:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`✅ ${event.event} processado. Custo salvo: $${custoFinal}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error("❌ Erro Crítico:", err);
    return NextResponse.json({ error: 'Webhook falhou' }, { status: 500 });
  }
}