import type { Metadata } from "next";
import { Montserrat, Playfair_Display, Geist_Mono } from "next/font/google";
import "../globals.css";

// Ver nota em src/app/[locale]/layout.tsx -- mesma tipografia oficial
// aplicada aqui pro painel/portal (área interna).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Área interna (login/admin/dashboard) — sempre em português, nunca indexada.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cerâmica Hub — Painel",
  robots: { index: false, follow: false },
};

export default function InternalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} ${playfairDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
