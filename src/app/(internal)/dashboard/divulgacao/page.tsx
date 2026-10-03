import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";
import { localizedUrl } from "@/lib/seo";
import { siteUrl } from "@/lib/seo";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { PromotionKit } from "@/components/promo/PromotionKit";

export const metadata = { title: "Divulgação — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function DashboardPromotionPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  const approved = business.status === "approved";

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/divulgacao" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div className="mb-2">
            <BackLink href="/dashboard" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Divulgação</h1>
            <p className="mt-2 text-[16px] text-muted">
              Divulgue sua empresa no Instagram, Facebook, Google e WhatsApp com artes prontas e links que mostram de onde vêm suas visitas.
            </p>
          </div>

          {approved ? (
            <PromotionKit profileUrl={localizedUrl("pt", `/empresa/${business.slug}`)} siteUrl={siteUrl} slug={business.slug} name={business.name} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-white/40 p-6 text-[15px] text-muted">
              O kit de divulgação fica disponível assim que o cadastro da empresa for aprovado e a página estiver no ar.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
