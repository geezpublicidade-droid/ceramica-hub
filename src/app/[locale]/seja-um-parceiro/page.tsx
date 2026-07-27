import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { PartnerLeadForm } from "@/components/PartnerLeadForm";
import { buildSocialMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("PartnerLeadPage");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/seja-um-parceiro" },
    ...buildSocialMetadata({ title, description, locale, path: "/seja-um-parceiro" }),
  };
}

export default async function PartnerLeadPage() {
  const t = await getTranslations("PartnerLeadPage");

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-16 pt-32 sm:pt-36">
          <div className="mx-auto max-w-lg">
            <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
              {t("heading")}
            </h1>
            <p className="mt-3 text-[17px] text-muted">{t("subtitle")}</p>

            <div className="mt-10">
              <PartnerLeadForm />
            </div>
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
