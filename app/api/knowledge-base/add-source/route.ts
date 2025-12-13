import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import PDFParser from 'pdf2json'; // Nova lib

// Força ambiente Node.js (Essencial para Vercel Functions de arquivo)
export const runtime = 'nodejs'; 

// Helper para converter a callback do pdf2json em Promise moderna
function parsePdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true); // 1 = Text content only

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      // O pdf2json retorna o texto cru e codificado (URL encoded), precisamos limpar
      try {
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText);
      } catch (e) {
        reject(e);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key ausente" }, { status: 500 });
    
    const client = new Retell({ apiKey });
    const contentType = req.headers.get("content-type") || "";
    
    let knowledgeBaseId = "";
    let sourceParams: any = {};

    // ---------------------------------------------------------
    // CENÁRIO A: UPLOAD DE ARQUIVO (PDF/TXT)
    // ---------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      knowledgeBaseId = formData.get("knowledgeBaseId") as string;
      const file = formData.get("file") as File;

      if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

      // Lê o arquivo para Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let textContent = "";

      console.log(`📂 Processando arquivo: ${file.name} (${file.type})`);

      if (file.type === "application/pdf") {
        // Usa nosso novo parser blindado
        textContent = await parsePdfBuffer(buffer);
      } else if (file.type === "text/plain") {
        textContent = buffer.toString('utf-8');
      } else {
        return NextResponse.json({ error: "Apenas PDF ou .txt são aceitos." }, { status: 400 });
      }

      // Limpeza de texto (remove quebras de linha excessivas e caracteres estranhos do PDF)
      textContent = textContent
        .replace(/----------------Page \(\d+\) Break----------------/g, "") // Remove marca d'agua do parser
        .replace(/\r\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (textContent.length < 10) {
        return NextResponse.json({ error: "Não foi possível ler texto deste arquivo (pode ser imagem)." }, { status: 400 });
      }

      console.log(`📄 Texto extraído: ${textContent.length} caracteres.`);

      sourceParams.knowledge_base_texts = [{ title: file.name, text: textContent }];
    } 
    // ---------------------------------------------------------
    // CENÁRIO B: JSON (URL ou Texto Manual)
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

    const response = await client.knowledgeBase.addSources(knowledgeBaseId, sourceParams);
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro Add-Source:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}