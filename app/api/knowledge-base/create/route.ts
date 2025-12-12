import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 1. FORÇAR RUNTIME NODEJS (Corrige instabilidade no Vercel/Next)
export const runtime = 'nodejs'; 

export async function POST(req: Request) {
  try {
    const { name, organizationId } = await req.json();

    // 2. VALIDAÇÃO DE TAMANHO (Evita erro 500 por estouro de campo)
    // - Documentação pede nomes curtos
    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    if (name.length > 40) return NextResponse.json({ error: "Nome deve ter no máximo 40 caracteres" }, { status: 400 });

    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key ausente" }, { status: 500 });

    // Inicializa SDK
    const client = new Retell({ apiKey });

    console.log(`🚀 Criando KB Blindada: "${name}"`);

    // 3. O PULO DO GATO (FIX DO ERRO 500)
    // Enviamos um texto de "bootstrap" para o motor de ingestão não processar vazio.
    const retellResponse = await client.knowledgeBase.create({
      knowledge_base_name: name,
      knowledge_base_texts: [
        {
          title: "Inicialização",
          text: "Base de conhecimento criada. Aguardando documentos."
        }
      ]
    });

    console.log(`✅ Sucesso Retell. ID: ${retellResponse.knowledge_base_id}`);

    // 4. PERSISTÊNCIA NO SUPABASE
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
          retell_kb_id: retellResponse.knowledge_base_id,
          organization_id: organizationId 
        });

      if (dbError) {
        console.error("❌ Erro ao salvar no Supabase (mas criado na Retell):", dbError);
      }
    }

    return NextResponse.json(retellResponse, { status: 201 });

  } catch (error: any) {
    // LOG DETALHADO PARA DEBUG
    console.error("❌ ERRO API RETELL:", {
      message: error?.message,
      status: error?.status,
      body: error?.body, // Tenta ver o corpo do erro que a Retell devolveu
    });

    return NextResponse.json(
      { 
        error: "Falha na criação da base.", 
        details: error?.body?.message || error.message || "Erro desconhecido" 
      },
      { status: 500 }
    );
  }
}