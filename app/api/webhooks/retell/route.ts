import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const event = await request.json();
    
    // Pega o ID da empresa configurado na Vercel
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID;

    // Se não tiver ID, avisa no log e para (evita erro no banco)
    if (!ORG_ID) {
        console.error("CRÍTICO: NEXT_PUBLIC_ORG_ID não configurado na Vercel.");
        return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    console.log(`🔔 Webhook Retell: ${event.event}`);

    // Processamos 'call_analyzed' (que tem o custo final) e 'call_ended' (backup)
    if (event.event === 'call_analyzed' || event.event === 'call_ended') {
      const callData = event.call;
      
      // Cálculo do Custo
      // A Retell costuma mandar em unidades que precisam de ajuste (ex: /100)
      let custoFinal = 0;
      if (callData.call_cost?.combined_cost) {
        custoFinal = callData.call_cost.combined_cost / 100;
      }

      // Monta o objeto para o Banco de Dados
      const payload = {
        organization_id: ORG_ID, // <--- CAMPO OBRIGATÓRIO (Multi-tenant)
        call_id: callData.call_id,
        agent_id: callData.agent_id,
        call_status: callData.call_status,
        start_timestamp: new Date(callData.start_timestamp).toISOString(),
        end_timestamp: new Date(callData.end_timestamp).toISOString(),
        duration_seconds: Math.round(callData.duration_ms / 1000),
        
        // Só grava o custo se vier maior que zero
        ...(custoFinal > 0 && { cost: custoFinal }),
        
        recording_url: callData.recording_url,
        transcript: callData.transcript,
        sentiment: callData.call_analysis?.user_sentiment || 'Unknown'
      };

      // --- ESTRATÉGIA FORÇA BRUTA (Delete + Insert) ---
      // Resolve o problema de "upsert" silencioso.
      
      // 1. Remove registro anterior se existir (limpa a área)
      await supabase.from('calls').delete().eq('call_id', callData.call_id);

      // 2. Insere o dado novo
      const { error } = await supabase
        .from('calls')
        .insert([payload]);

      if (error) {
        console.error("❌ Erro ao salvar no Supabase:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`✅ Chamada salva na Org ${ORG_ID}. Custo: $${custoFinal}`);
    }

    // Responde 200 OK para a Retell ficar feliz
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error("❌ Erro Crítico Webhook:", err);
    return NextResponse.json({ error: 'Webhook falhou' }, { status: 500 });
  }
}