import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "", 
});

export async function GET() {
  try {
    // Tenta listar os agentes para validar a conexão
    const agents = await retell.agent.list();
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha na conexão', details: String(error) }, 
      { status: 500 }
    );
  }
}