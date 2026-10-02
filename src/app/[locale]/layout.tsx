import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Montserrat, Playfair_Display, Geist_Mono, Alexandria } from "next/font/google";
import { routing } from "@/i18n/routing";
import { siteUrl, buildSocialMetadata, buildAlternates } from "@/lib/seo";
import { SupportWhatsAppButton } from "@/components/support/SupportWhatsAppButton";
import { PortalPageViewTracker } from "@/components/PortalPageViewTracker";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { ReferralCapture } from "@/components/referrals/ReferralCapture";
import "../globals.css";
import { jsonLdString } from "@/lib/json-ld";

// Tipografia oficial do Manual de Identidade Visual v1.0 -- Montserrat é a
// principal (títulos/textos), Playfair Display fica disponível via
// `.font-display`/`--font-display` pra destaques pontuais (o manual não
// pede pra trocar TODO título por serifada, só usar em "frases que reforçam
// o propósito").
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

// Usada só no banner de anúncios (ver AdBanner.tsx) -- é a fonte do esboço
// do Figma pra esse componente especificamente, não o resto do site.
const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["latin"],
});

export const viewport: Viewport = { themeColor: "#b3553a" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(siteUrl),
    applicationName: "Cerâmica Hub",
    icons: { apple: "/api/pwa-icon/180" },
    appleWebApp: { capable: true, title: "Cerâmica Hub", statusBarStyle: "default" },
    title,
    description,
    alternates: buildAlternates(locale, "/"),
    ...buildSocialMetadata({ title, description, locale, path: "/", type: "website" }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cerâmica Hub",
    description: t("description"),
    url: siteUrl,
  };

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${playfairDisplay.variable} ${geistMono.variable} ${alexandria.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          {children}
          <PortalPageViewTracker />
          <PwaRegister />
          <ReferralCapture />
        </NextIntlClientProvider>
        <SupportWhatsAppButton />
      </body>
    </html>
  );
}
