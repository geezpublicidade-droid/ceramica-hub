import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono, Alexandria } from "next/font/google";
import { routing } from "@/i18n/routing";
import { siteUrl, buildSocialMetadata } from "@/lib/seo";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
    title,
    description,
    alternates: { canonical: locale === routing.defaultLocale ? "/" : `/${locale}` },
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
      className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
