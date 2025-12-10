import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // <--- Importação correta

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. INICIALIZAÇÃO BLINDADA
    // O await aqui é obrigatório no Next.js 15+ com cookies
    const supabase = await createClient(); 

    // 2. Verifica quem está logado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("❌ Usuário não logado ou erro de auth");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 3. Descobre a Organização
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
        console.error("❌ Perfil sem organização:", profileError);
        return NextResponse.json({ error: 'Perfil incompleto' }, { status: 400 });
    }

    const ORG_ID = profile.organization_id;
    console.log(`✅ Buscando agentes para a Org: ${ORG_ID}`);

    // 4. Busca os agentes
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('organization_id', ORG_ID)
      .order('created_at', { ascending: false });

    if (error) {
        throw error; // Joga para o catch abaixo
    }

    return NextResponse.json(data);

  } catch (error: any) {
    // 5. O LOG QUE SALVA VIDAS
    // Isso vai aparecer no seu terminal do VS Code ou nos logs da Vercel
    console.error("🔥 ERRO FATAL NA LISTAGEM:", error);
    
    return NextResponse.json({ 
        error: 'Erro ao buscar agentes', 
        details: error.message || String(error) 
    }, { status: 500 });
  }
}