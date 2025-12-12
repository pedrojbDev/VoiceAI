import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Em produção, pegue o org_id da sessão ou query param seguro
    // Por enquanto, listamos todos ou filtramos se vier na URL
    
    console.log("📂 Listando Bases de Conhecimento...");

    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}