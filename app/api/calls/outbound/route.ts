import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { agent_id, to_number } = await request.json();

    if (!to_number) {
      return NextResponse.json({ error: "Número de destino obrigatório" }, { status: 400 });
    }

    // 1. Busca qual número você comprou na Retell (para usar como origem)
    // Referência: client.phone_number.list()
    const numbersList = await retell.phoneNumber.list();
    
    if (!numbersList || numbersList.length === 0) {
      return NextResponse.json({ error: "Você não tem nenhum número comprado na Retell!" }, { status: 400 });
    }

    const from_number = numbersList[0].phone_number; // Pega o primeiro da lista
    console.log(`📞 Iniciando chamada de ${from_number} para ${to_number}...`);

    // 2. Cria a chamada telefônica real
    // Referência: client.call.create_phone_call()
    const callResponse = await retell.call.createPhoneCall({
      from_number: from_number,
      to_number: to_number,
      override_agent_id: agent_id,
    });

    console.log("✅ Chamada disparada:", callResponse.call_id);

    return NextResponse.json({ success: true, call_id: callResponse.call_id });

  } catch (error) {
    console.error("Erro ao ligar:", error);
    return NextResponse.json({ error: 'Falha ao iniciar chamada telefônica' }, { status: 500 });
  }
}