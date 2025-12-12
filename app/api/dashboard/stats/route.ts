import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializa Supabase com Permissão Admin (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    console.log("📊 Calculando estatísticas do Dashboard...");

    // 1. Busca TODAS as chamadas (apenas as colunas necessárias para ficar leve)
    // Se seu sistema já tem filtro por organização no frontend, 
    // idealmente deveríamos filtrar por org_id aqui também.
    const { data: calls, error } = await supabase
      .from('calls')
      .select('cost, duration_seconds');

    if (error) {
      console.error("❌ Erro ao buscar estatísticas:", error);
      throw error;
    }

    // 2. Processamento Matemático (Agregação)
    const totalCalls = calls.length;

    // Soma os segundos e converte para minutos (arredondado para 1 casa decimal)
    const totalSeconds = calls.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
    const totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;

    // Soma o custo (garantindo que seja tratado como número)
    const totalCost = calls.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

    // 3. Monta o Objeto de Resposta
    const stats = {
      total_calls: totalCalls,
      total_minutes: totalMinutes,
      total_cost: totalCost.toFixed(2) // Formata para 2 casas decimais (ex: 10.50)
    };

    console.log("✅ Stats Calculados:", stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error("🔥 Crash na rota /api/dashboard/stats:", error);
    // Retorna zeros em caso de erro para não quebrar a UI
    return NextResponse.json({
      total_calls: 0,
      total_minutes: 0,
      total_cost: "0.00"
    }, { status: 200 });
  }
}