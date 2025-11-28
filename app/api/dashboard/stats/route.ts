import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Sem cache para ver o custo subir na hora

export async function GET() {
  try {
    // Busca todas as chamadas
    const { data: calls, error } = await supabase
      .from('calls')
      .select('cost, duration_seconds');

    if (error) throw error;

    // Calcula os totais na mão (simples e rápido)
    const totalCalls = calls.length;
    
    // Soma os custos (vem como string ou number, garantimos float)
    const totalCost = calls.reduce((acc, call) => acc + Number(call.cost || 0), 0);
    
    // Soma a duração em segundos
    const totalDurationSeconds = calls.reduce((acc, call) => acc + (call.duration_seconds || 0), 0);
    
    // Converte segundos para minutos (arredondado)
    const totalMinutes = Math.round(totalDurationSeconds / 60);

    return NextResponse.json({
      totalCalls,
      totalCost: totalCost.toFixed(2), // Formata para 2 casas (ex: 1.50)
      totalMinutes
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao calcular stats' }, { status: 500 });
  }
}