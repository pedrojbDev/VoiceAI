import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID;

    // Busca chamadas da organização, ordenadas da mais recente
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('organization_id', ORG_ID)
      .order('created_at', { ascending: false })
      .limit(50); // Traz as últimas 50 para não pesar

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar calls' }, { status: 500 });
  }
}