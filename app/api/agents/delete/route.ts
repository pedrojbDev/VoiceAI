import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { createClient } from '@/utils/supabase/server'; // <--- Cliente com Auth

const retell = new Retell({ apiKey: process.env.RETELL_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // Await obrigatório
    const { agent_id } = await request.json();

    // 1. Segurança: Verifica se o agente pertence à Org do usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    
    // Tenta deletar no banco filtrando pela Org (se não for da org, não deleta)
    const { error, count } = await supabase
      .from('agents')
      .delete()
      .eq('retell_agent_id', agent_id)
      .eq('organization_id', profile?.organization_id); // <--- TRAVA DE SEGURANÇA

    if (error || count === 0) {
        return NextResponse.json({ error: 'Agente não encontrado ou sem permissão' }, { status: 403 });
    }

    // 2. Se deletou no banco, deleta na Retell
    try {
      await retell.agent.delete(agent_id);
    } catch (e) {
      console.log("Aviso: Já deletado na Retell");
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}