import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Pricing } from "@/components/Pricing";
import { buildSocialMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("PlanosPage");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/planos" },
    ...buildSocialMetadata({ title, description, locale, path: "/planos" }),
  };
}

export default async function PlanosPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Pricing />
      </main>
      <CinematicFooter />
    </>
  );
}
