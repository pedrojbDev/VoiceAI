import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID;

    // Filtra pela Organização
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('organization_id', ORG_ID) // <--- FILTRO DE SEGURANÇA
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar agentes' }, { status: 500 });
  }
}