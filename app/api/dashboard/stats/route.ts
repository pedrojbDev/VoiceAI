import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Força o Next.js a não fazer cache (Dados em tempo real)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID;

    if (!ORG_ID) {
        return NextResponse.json({ totalCalls: 0, totalCost: '0.00', totalMinutes: 0 });
    }

    // Busca apenas as chamadas da SUA organização
    const { data: calls, error } = await supabase
      .from('calls')
      .select('cost, duration_seconds')
      .eq('organization_id', ORG_ID); // <--- O FILTRO IMPORTANTE

    if (error) throw error;

    // Se não tiver chamadas, retorna zerado para não dar erro de reduce
    if (!calls || calls.length === 0) {
        return NextResponse.json({
            totalCalls: 0,
            totalCost: '0.00',
            totalMinutes: 0
        });
    }

    // Cálculos
    const totalCalls = calls.length;
    
    // Soma custos (garantindo que seja número)
    const totalCost = calls.reduce((acc, call) => acc + Number(call.cost || 0), 0);
    
    // Soma minutos
    const totalDurationSeconds = calls.reduce((acc, call) => acc + (call.duration_seconds || 0), 0);
    const totalMinutes = Math.round(totalDurationSeconds / 60);

    return NextResponse.json({
      totalCalls,
      totalCost: totalCost.toFixed(2),
      totalMinutes
    });

  } catch (error) {
    console.error("Erro Stats:", error);
    return NextResponse.json({ error: 'Erro ao calcular stats' }, { status: 500 });
  }
}