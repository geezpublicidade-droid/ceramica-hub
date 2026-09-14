import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getPublicImpactReport } from "@/lib/services/impact-report";
import { buildSocialMetadata } from "@/lib/seo";

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Impacto");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/impacto" },
    ...buildSocialMetadata({ title, description, locale, path: "/impacto" }),
  };
}

export default async function ImpactoPage() {
  const t = await getTranslations("Impacto");
  const report = await getPublicImpactReport();

  const GROUP_KEYS = ["economia", "emprego", "fluxo", "visibilidade", "confianca"] as const;

  // Cada grupo do relatório tem exatamente as métricas que a tradução declara
  // pra ele — deriva a lista em vez de repetir cada nome de campo 3x (chave do
  // report, chave da tradução, e o pareamento manual entre as duas).
  const groups = GROUP_KEYS.map((key) => ({
    key,
    metrics: Object.entries(report[key]).map(([field, value]) => ({
      label: t(`groups.${key}.${field}`),
      value,
    })),
  }));

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-5xl">
          <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-[17px] text-muted">{t("subtitle")}</p>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.key} className="glass-card-light rounded-3xl p-6">
                <h2 className="text-[15px] font-medium uppercase tracking-[0.15em] text-primary">
                  {t(`groups.${group.key}.label`)}
                </h2>
                <div className="mt-5 flex flex-col gap-4">
                  {group.metrics.map((metric) => (
                    <div key={metric.label}>
                      <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                      <p className="mt-1 text-[15px] leading-snug text-muted">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-12 max-w-2xl text-[14px] leading-relaxed text-muted">{t("disclaimer")}</p>
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
