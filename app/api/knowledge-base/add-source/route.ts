import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

export const runtime = 'nodejs'; // Obrigatório para lidar com streams de arquivos

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key ausente" }, { status: 500 });
    
    const client = new Retell({ apiKey });
    const contentType = req.headers.get("content-type") || "";

    let knowledgeBaseId = "";
    let sourceParams: any = {};

    // ---------------------------------------------------------
    // CENÁRIO A: Upload de Arquivo (Multipart/Form-Data)
    // ---------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      knowledgeBaseId = formData.get("knowledgeBaseId") as string;
      const file = formData.get("file") as File;

      if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

      // NOTA TÉCNICA DO CTO: 
      // A Retell não aceita o binário direto no endpoint 'add_sources'.
      // A melhor prática White Label é extrair o texto aqui e enviar como 'text'.
      // Para MVP rápido sem configurar parse de PDF complexo, vamos simular
      // que você está enviando apenas texto por enquanto.
      // Se precisar de PDF real, use a lib 'pdf-parse' aqui para ler o Buffer.
      
      return NextResponse.json({ error: "Upload de arquivos requer parser (Instale pdf-parse)" }, { status: 501 });
    } 
    
    // ---------------------------------------------------------
    // CENÁRIO B: JSON (URL ou Texto Manual) - O QUE VOCÊ USA HOJE
    // ---------------------------------------------------------
    else {
      const body = await req.json();
      knowledgeBaseId = body.knowledgeBaseId;
      const { url, text, title } = body;

      if (url) {
        sourceParams.knowledge_base_urls = [url];
      } else if (text && title) {
        sourceParams.knowledge_base_texts = [{ title, text }];
      } else {
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
      }
    }

    if (!knowledgeBaseId) return NextResponse.json({ error: "ID da Base faltando" }, { status: 400 });

    console.log(`📚 Adicionando fonte à KB ${knowledgeBaseId}...`);

    // Chamada SDK
    const response = await client.knowledgeBase.addSources(knowledgeBaseId, sourceParams);

    console.log("✅ Fonte adicionada!");
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro Add-Source:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}