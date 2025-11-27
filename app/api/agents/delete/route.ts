import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { supabase } from '@/lib/supabase';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { agent_id } = await request.json();

    // 1. Tenta apagar na Retell
    // Colocamos num try/catch separado, porque se já foi apagado lá (seu caso atual),
    // a API vai dar erro 404, mas nós QUEREMOS continuar para apagar do banco.
    try {
      await retell.agent.delete(agent_id);
    } catch (retellError) {
      console.log("Aviso: Agente já não existia na Retell ou erro de API", retellError);
    }

    // 2. Apaga do Supabase (A Limpeza Final)
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('retell_agent_id', agent_id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}