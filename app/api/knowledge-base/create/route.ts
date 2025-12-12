import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------------
    // 1. SETUP SUPABASE (Para passar pelo RLS)
    // ------------------------------------------------------------------
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
            } catch {
              // Ignorar erros de cookie em rotas de API
            }
          },
        },
      }
    );

    // Verifica quem é o usuário logado para satisfazer o RLS
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // ------------------------------------------------------------------
    // 2. SETUP RETELL E VALIDAÇÕES
    // ------------------------------------------------------------------
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key da Retell não configurada." }, { status: 500 });
    }

    const client = new Retell({ apiKey });

    const body = await req.json();
    const { name, organizationId } = body; // O Frontend DEVE mandar o organizationId

    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

    console.log(`🚀 [1/3] Criando KB na Retell: "${name}"`);

    // ------------------------------------------------------------------
    // 3. CRIAÇÃO NA RETELL (CORRIGIDA - SEM O PARÂMETRO INVÁLIDO)
    // ------------------------------------------------------------------
    // Removemos 'enable_turning_on_knowledge_base' pois não existe mais.
    const retellResponse = await client.knowledgeBase.create({
      knowledge_base_name: name
    });

    console.log(`✅ [2/3] Retell OK. ID: ${retellResponse.knowledge_base_id}`);

    // ------------------------------------------------------------------
    // 4. SALVAR NO SUPABASE (RESPEITANDO O RLS)
    // ------------------------------------------------------------------
    // Se você não passar organization_id que bate com o usuário, o RLS bloqueia.
    // Se o frontend não estiver mandando organizationId, use um fixo ou busque do usuário.
    
    if (organizationId) {
        const { error: dbError } = await supabase
        .from('knowledge_bases')
        .insert({
            name: name,
            retell_kb_id: retellResponse.knowledge_base_id,
            organization_id: organizationId 
        });

        if (dbError) {
            console.error("❌ [Erro Supabase RLS]:", dbError);
            // Não vamos travar o retorno se falhar o banco, mas logamos o erro RLS
        } else {
            console.log("✅ [3/3] Salvo no Supabase com sucesso.");
        }
    } else {
        console.warn("⚠️ organizationId não fornecido pelo frontend. Pulando salvamento no banco para evitar erro RLS.");
    }

    return NextResponse.json(retellResponse, { status: 201 });

  } catch (error: any) {
    console.error("❌ Erro Geral:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno" },
      { status: 500 }
    );
  }
}