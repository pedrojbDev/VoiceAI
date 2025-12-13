import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
// Truque para libs antigas em Next.js App Router
const pdf = require('pdf-parse'); 

export const runtime = 'nodejs'; 

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key ausente" }, { status: 500 });
    
    const client = new Retell({ apiKey });
    const contentType = req.headers.get("content-type") || "";
    
    let knowledgeBaseId = "";
    let sourceParams: any = {};

    // --- CENÁRIO A: UPLOAD DE ARQUIVO ---
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      knowledgeBaseId = formData.get("knowledgeBaseId") as string;
      const file = formData.get("file") as File;

      if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

      // Lê o arquivo
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let textContent = "";

      if (file.type === "application/pdf") {
        // Usa o parser importado via require
        const data = await pdf(buffer);
        textContent = data.text;
      } else if (file.type === "text/plain") {
        textContent = buffer.toString('utf-8');
      } else {
        return NextResponse.json({ error: "Apenas PDF ou .txt são aceitos." }, { status: 400 });
      }

      // Limpeza
      textContent = textContent.replace(/\n+/g, " ").trim();
      if (textContent.length < 10) return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });

      sourceParams.knowledge_base_texts = [{ title: file.name, text: textContent }];
    } 
    // --- CENÁRIO B: JSON ---
    else {
      const body = await req.json();
      knowledgeBaseId = body.knowledgeBaseId;
      const { url, text, title } = body;

      if (url) sourceParams.knowledge_base_urls = [url];
      else if (text) sourceParams.knowledge_base_texts = [{ title, text }];
    }

    if (!knowledgeBaseId) return NextResponse.json({ error: "ID faltando" }, { status: 400 });

    const response = await client.knowledgeBase.addSources(knowledgeBaseId, sourceParams);
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}