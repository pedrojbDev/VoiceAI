import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { name, organizationId } = await req.json();

    // 1. Validação Básica
    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key ausente" }, { status: 500 });

    // Debug: Verifica se a chave tem espaços invisíveis (erro comum)
    if (apiKey.trim() !== apiKey) {
      console.error("⚠️ PERIGO: Sua API Key no .env tem espaços em branco no final ou início!");
    }

    console.log(`🚀 [1/3] Criando KB via Fetch Nativo: "${name}"`);

    // 2. CHAMADA DIRETA (Sem usar o SDK da Retell para evitar Timeout)
    const retellResponse = await fetch('https://api.retellai.com/create-knowledge-base', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        knowledge_base_name: name
      })
    });

    const retellData = await retellResponse.json();

    if (!retellResponse.ok) {
      throw new Error(`Erro Retell (${retellResponse.status}): ${JSON.stringify(retellData)}`);
    }

    console.log(`✅ [2/3] Sucesso Retell. ID: ${retellData.knowledge_base_id}`);

    // 3. SALVAR NO SUPABASE
    if (organizationId) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
              } catch {}
            },
          },
        }
      );

      const { error: dbError } = await supabase
        .from('knowledge_bases')
        .insert({
          name: name,
          retell_kb_id: retellData.knowledge_base_id,
          organization_id: organizationId 
        });

      if (dbError) {
        console.error("❌ [Erro Supabase]:", dbError);
      } else {
        console.log("✅ [3/3] Salvo no Banco.");
      }
    }

    return NextResponse.json(retellData, { status: 201 });

  } catch (error: any) {
    console.error("❌ ERRO FATAL:", error);
    return NextResponse.json(
      { error: error.message || "Timeout ou Erro de Conexão" },
      { status: 500 }
    );
  }
}