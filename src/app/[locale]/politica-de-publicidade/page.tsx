import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { buildSocialMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("PoliticaPublicidade");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/politica-de-publicidade" },
    ...buildSocialMetadata({ title, description, locale, path: "/politica-de-publicidade" }),
  };
}

export default async function PoliticaPublicidadePage() {
  const t = await getTranslations("PoliticaPublicidade");
  const tCommon = await getTranslations("Common");
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <p className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-[15px] text-amber-800">
            {tCommon("legalPlaceholderNotice")}
          </p>
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight">{t("title")}</h1>
          <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-muted">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
            <p>{t("paragraph3")}</p>
            <p>
              {t.rich("paragraph4", {
                contactLink: (chunks: ReactNode) => (
                  <Link href="/contato" className="text-primary underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
