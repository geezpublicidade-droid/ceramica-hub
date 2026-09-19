import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { buildSocialMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("FaqPage");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/faq" },
    ...buildSocialMetadata({ title, description, locale, path: "/faq" }),
  };
}

export default async function FaqPage() {
  const t = await getTranslations("FaqPage");
  const items = t.raw("items") as { question: string; answer: string }[];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-24 pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
              {t("heading")}
            </h1>
            <div className="mt-12 divide-y divide-border border-t border-border">
              {items.map((item) => (
                <div key={item.question} className="py-6">
                  <h2 className="text-[18px] font-semibold tracking-tight text-foreground">{item.question}</h2>
                  <p className="mt-2 text-[16px] leading-relaxed text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
