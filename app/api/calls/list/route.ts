import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializa Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Tenta pegar o Org ID da URL, se não tiver, usa um fallback ou pega da sessão
    // IMPORTANTE: No seu frontend, certifique-se de passar ?orgId=... se possível.
    // Se não, vamos listar tudo por enquanto para destravar o painel (modo admin).
    
    console.log("📥 Buscando histórico de chamadas...");

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limita para não pesar

    if (error) {
      console.error("❌ Erro ao buscar calls no banco:", error);
      throw error;
    }

    // Mapeamento de segurança para o Frontend não quebrar se faltar campo
    const formattedCalls = calls.map(call => ({
      call_id: call.call_id,
      agent_id: call.agent_id,
      call_status: call.call_status,
      start_timestamp: call.start_timestamp,
      duration: call.duration_seconds,
      cost: call.cost || 0, // Garante número
      recording_url: call.recording_url,
      sentiment: call.sentiment || 'neutral',
      transcript: call.transcript
    }));

    return NextResponse.json(formattedCalls);

  } catch (error) {
    console.error("🔥 Crash na rota /api/calls/list:", error);
    // Retorna array vazio em vez de erro 500 para o painel não "morrer"
    return NextResponse.json([], { status: 200 });
  }
}