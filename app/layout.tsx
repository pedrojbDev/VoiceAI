import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar"; // Importa nosso menu


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voice AI SaaS",
  description: "Plataforma de Automação de Voz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-neutral-950 text-white`}>
        <div className="flex min-h-screen">
          {/* Menu Lateral Fixo */}
          <Sidebar />
          
          {/* Área de Conteúdo (Deslocada para a direita) */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}