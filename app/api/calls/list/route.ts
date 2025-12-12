import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializa Supabase com a Service Role Key para garantir acesso
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    console.log("📥 Buscando histórico de chamadas...");

    // Busca as chamadas no banco (Tabela 'calls')
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limite de segurança para performance

    if (error) {
      console.error("❌ Erro ao buscar calls no banco:", error);
      throw error;
    }

    // Mapeamento de segurança (Data Transformation)
    const formattedCalls = calls.map(call => ({
      call_id: call.call_id,
      agent_id: call.agent_id,
      call_status: call.call_status,
      start_timestamp: call.start_timestamp,
      
      // --- CORREÇÃO DA DURAÇÃO ---
      // Enviamos os dois formatos possíveis para garantir compatibilidade com a UI
      // O '|| 0' garante que nunca vá null, evitando o bug visual
      duration: call.duration_seconds || 0,         
      duration_seconds: call.duration_seconds || 0, 

      cost: call.cost || 0, // Garante que custo seja numérico
      recording_url: call.recording_url,
      sentiment: call.sentiment || 'neutral',
      transcript: call.transcript
    }));

    return NextResponse.json(formattedCalls);

  } catch (error) {
    console.error("🔥 Crash na rota /api/calls/list:", error);
    // Retorna array vazio em vez de erro 500 para o painel não "morrer" completamente
    return NextResponse.json([], { status: 200 });
  }
}