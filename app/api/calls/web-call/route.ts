import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { agent_id } = await request.json();

    if (!agent_id) {
        return NextResponse.json({ error: "Agent ID obrigatório" }, { status: 400 });
    }

    // Cria a chamada web e pega o Token de acesso
    const webCallResponse = await retell.call.createWebCall({
      agent_id: agent_id,
    });

    return NextResponse.json(webCallResponse);

  } catch (error) {
    console.error('Erro ao criar chamada:', error);
    return NextResponse.json({ error: 'Erro ao iniciar chamada' }, { status: 500 });
  }
}