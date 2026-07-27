import { getTranslations } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/server";
import { RegisterWizard } from "@/components/register/RegisterWizard";
import { buildSocialMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Cadastro");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/cadastro" },
    ...buildSocialMetadata({ title, description, locale, path: "/cadastro" }),
  };
}

export type TowerOption = { id: string; name: string; address: string };

async function getTowers(): Promise<TowerOption[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("towers")
    .select("id, name, address")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function CadastroPage() {
  const t = await getTranslations("Cadastro");
  const towers = await getTowers();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight text-foreground">
          {t("headline")}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">{t("subhead")}</p>

        <div className="mt-10">
          <RegisterWizard towers={towers} />
        </div>
      </div>
    </main>
  );
}
