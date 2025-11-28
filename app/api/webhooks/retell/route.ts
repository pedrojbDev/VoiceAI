import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const event = await request.json();
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID; // Pega do env

    if (event.event === 'call_analyzed' || event.event === 'call_ended') {
      const callData = event.call;
      let custoFinal = 0;
      
      if (callData.call_cost?.combined_cost) {
        custoFinal = callData.call_cost.combined_cost / 100;
      }

      const payload = {
        organization_id: ORG_ID, // <--- FATURA PARA A EMPRESA CERTA
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

      await supabase.from('calls').upsert(payload, { onConflict: 'call_id' });
      console.log(`✅ Call salva na Org ${ORG_ID}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook falhou' }, { status: 500 });
  }
}