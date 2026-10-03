import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Pricing } from "@/components/Pricing";
import { CategoryOffersSection } from "@/components/CategoryOffersSection";
import { buildAlternates, buildSocialMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("PlanosPage");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: buildAlternates(locale, "/planos"),
    ...buildSocialMetadata({ title, description, locale, path: "/planos" }),
  };
}

export default async function PlanosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string | string[] }>;
}) {
  const { locale } = await params;
  const { categoria } = await searchParams;
  const selectedPath = (Array.isArray(categoria) ? categoria[0] : categoria)?.trim().slice(0, 120);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Pricing />
        <CategoryOffersSection locale={locale} selectedPath={selectedPath} />
      </main>
      <CinematicFooter />
    </>
  );
}
