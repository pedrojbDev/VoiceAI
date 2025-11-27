import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Evita que o Next.js faça cache estático dessa rota
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Busca todos os agentes salvos no Supabase, do mais novo para o mais antigo
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar agentes' }, { status: 500 });
  }
}