import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("Privacidade");
  return { title: t("metaTitle") };
}

export default async function PrivacidadePage() {
  const t = await getTranslations("Privacidade");
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight">
            {t("title")}
          </h1>
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
