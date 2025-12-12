import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, organization_id } = body;

    if (!name || !organization_id) {
      return NextResponse.json({ error: "Nome e Org ID obrigatórios" }, { status: 400 });
    }

    console.log(`🧠 Criando Knowledge Base: ${name}`);

    // 1. Cria na Retell AI
    const kbResponse = await retell.knowledgeBase.create({
      knowledge_base_name: name,
      enable_auto_refresh: true // Opcional: mantem atualizado se for URL
    });

    console.log("✅ KB criada na Retell:", kbResponse.knowledge_base_id);

    // 2. Salva no Supabase (Vínculo White Label)
    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert([
        {
          name: name,
          retell_kb_id: kbResponse.knowledge_base_id,
          organization_id: organization_id,
          status: 'ready'
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);

  } catch (error: any) {
    console.error("🔥 Erro ao criar KB:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}