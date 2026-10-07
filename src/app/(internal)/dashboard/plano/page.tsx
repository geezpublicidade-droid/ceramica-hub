import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessPhotos, getBusinessServices, getOwnedInvoices, getOwnedPromotions } from "@/lib/services/platform";
import { getCompanyPermissions, getContentUsage, getPlanHistory } from "@/lib/services/company-plan";
import { loadPlanCatalog, planLadder } from "@/lib/services/plan-catalog";
import { loadPlanPrices } from "@/lib/services/plan-prices";
import { computeUsage, getLimit } from "@/lib/plans/resolve";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { PlanBilling, type BillablePlan } from "@/components/dashboard/PlanBilling";
import { PlanOverview } from "@/components/dashboard/plan/PlanOverview";
import { FeatureAvailability, UsageMeters } from "@/components/dashboard/plan/UsageAndFeatures";
import { ContentChooser, type ChooserGroup } from "@/components/dashboard/plan/ContentChooser";
import { PlanComparisonTable, PlanHistoryList } from "@/components/dashboard/plan/PlanHistoryAndCompare";

export const metadata = { title: "Plano e assinatura — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function PlanoPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const permissions = await getCompanyPermissions(businessId);
  if (!permissions) redirect("/login");
  const isOwner = !session?.user?.isStaff;

  const [catalog, prices, usageCounts, invoices, history, services, photos, promotions] = await Promise.all([
    loadPlanCatalog(),
    loadPlanPrices(),
    getContentUsage(businessId),
    getOwnedInvoices(businessId),
    getPlanHistory(businessId),
    getBusinessServices(businessId),
    getBusinessPhotos(businessId),
    getOwnedPromotions(businessId),
  ]);

  const ladder = planLadder(catalog);
  const usage = computeUsage(permissions.features, usageCounts);
  const planNames = Object.fromEntries(catalog.plans.map((plan) => [plan.key, plan.name]));

  const today = new Date().toISOString().slice(0, 10);
  const groups: ChooserGroup[] = [
    { kind: "service", title: "Serviços", limit: getLimit(permissions.features, "services"), items: services.map((item) => ({ id: item.id, label: item.name, active: item.active !== false })) },
    { kind: "photo", title: "Fotos da galeria", limit: getLimit(permissions.features, "gallery_images"), items: photos.filter((item) => item.kind === "photo").map((item, index) => ({ id: item.id, label: item.caption ?? `Foto ${index + 1}`, active: item.active !== false })) },
    { kind: "video", title: "Vídeos em destaque", limit: getLimit(permissions.features, "featured_videos"), items: photos.filter((item) => item.kind === "video").map((item, index) => ({ id: item.id, label: item.caption ?? `Vídeo ${index + 1}`, active: item.active !== false })) },
    {
      kind: "promotion",
      title: "Promoções",
      limit: getLimit(permissions.features, "active_promotions"),
      items: promotions.filter((item) => !item.validUntil || item.validUntil >= today).map((item) => ({ id: item.id, label: item.title, active: item.active })),
    },
  ];

  const billable: BillablePlan[] = ladder
    .filter((plan) => {
      const price = prices[plan.key];
      return plan.key !== "presenca" && price?.billingType === "mensal" && (price.monthlyCents ?? 0) > 0;
    })
    .map((plan) => ({ key: plan.key, name: plan.name, priceCents: prices[plan.key].monthlyCents ?? 0 }));

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/plano" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div>
            <BackLink href="/dashboard" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Plano e assinatura</h1>
            <p className="mt-2 text-[16px] text-muted">O que seu plano libera, o quanto você já usou e como evoluir. Seu conteúdo nunca é apagado: ao mudar de plano, o que passa do limite fica salvo.</p>
          </div>
          <PlanOverview permissions={permissions} />
          <UsageMeters usage={usage} features={permissions.features} plan={permissions.plan} ladder={ladder} />
          <ContentChooser groups={groups} />
          <FeatureAvailability features={permissions.features} ladder={ladder} />
          {isOwner && <PlanBilling currentPlan={permissions.contractedPlan} invoices={invoices} plans={billable} discountPercent={permissions.discountPercent} planNames={planNames} />}
          <PlanComparisonTable ladder={ladder} currentPlan={permissions.plan} />
          <PlanHistoryList history={history} planNames={planNames} />
        </div>
      </div>
    </main>
  );
}
