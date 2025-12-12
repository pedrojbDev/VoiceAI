import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

export async function POST(req: Request) {
  try {
    // 1. Validação de Segurança da Chave (Corrige o erro de 'undefined')
    const apiKey = process.env.RETELL_API_KEY;
    
    if (!apiKey) {
      console.error("❌ ERRO: RETELL_API_KEY não encontrada.");
      return NextResponse.json({ error: "Erro de configuração no servidor" }, { status: 500 });
    }

    // Inicializamos o cliente AQUI, onde temos certeza que apiKey é uma string
    const client = new Retell({
      apiKey: apiKey,
    });

    // 2. Recebendo dados
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    console.log(`🧠 Criando KB: ${name}`);

    // 3. Chamada CORRIGIDA (Removemos o parâmetro inválido 'enable_turning_on_knowledge_base')
    // A propriedade correta é acessada via 'knowledgeBase' (camelCase) no Node.js
    const response = await client.knowledgeBase.create({
      knowledge_base_name: name
      // O SDK já ativa a base por padrão ou não exige mais aquele booleano explícito
    });

    console.log("✅ Sucesso:", response);

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error("❌ Erro API:", error);
    
    // Tratamento para devolver o erro exato da Retell se houver
    const errorMessage = error?.error?.message || error.message || "Erro desconhecido";
    
    return NextResponse.json(
      { error: "Falha ao criar base", details: errorMessage }, 
      { status: 500 }
    );
  }
}