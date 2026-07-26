import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";

export async function generateMetadata() {
  const t = await getTranslations("Contato");
  return { title: t("metaTitle") };
}

export default async function ContatoPage() {
  const t = await getTranslations("Contato");
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-muted">{t("intro")}</p>
          <div className="mt-8 flex flex-col gap-3 text-[15px]">
            <p>
              <span className="text-muted">{t("emailLabel")}</span>{" "}
              <a href="mailto:geezpublicidade@gmail.com" className="text-primary underline">
                geezpublicidade@gmail.com
              </a>
            </p>
            <p>
              <span className="text-muted">{t("instagramLabel")}</span>{" "}
              <a
                href="https://instagram.com/geezmarketing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                @geezmarketing
              </a>
            </p>
          </div>
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
