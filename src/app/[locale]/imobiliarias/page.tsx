import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { RealEstateListingsGrid } from "@/components/RealEstateListingsGrid";
import { getActiveListings } from "@/lib/services/real-estate";

export const revalidate = 60;

export async function generateMetadata() {
  const t = await getTranslations("Imobiliarias");
  return { title: t("metaTitle") };
}

export default async function ImobiliariasPage() {
  const t = await getTranslations("Imobiliarias");
  const listings = await getActiveListings();

  const labels = {
    filterAll: t("filterAll"),
    filterVenda: t("filterVenda"),
    filterLocacao: t("filterLocacao"),
    requestInfo: t("requestInfo"),
    available: t("available"),
    unavailable: t("unavailable"),
    onRequest: t("onRequest"),
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

          {listings.length === 0 ? (
            <p className="mt-14 text-[16px] text-muted">{t("empty")}</p>
          ) : (
            <Suspense fallback={null}>
              <RealEstateListingsGrid listings={listings} labels={labels} />
            </Suspense>
          )}
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
