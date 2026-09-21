import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getBusinessById,
  getBusinessServices,
  getBusinessPhotos,
  getOwnedPromotions,
  getVirtualTourScenes,
} from "@/lib/services/platform";
import { limitsFor } from "@/lib/plan-limits";
import { EditPageManager } from "@/components/dashboard/EditPageManager";
import { BackLink } from "@/components/nav/BackLink";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata = { title: "Editar página — Cerâmica Hub" };

export default async function EditarPaginaPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  const [services, photos, promotions, virtualTourScenes] = await Promise.all([
    getBusinessServices(businessId),
    getBusinessPhotos(businessId),
    getOwnedPromotions(businessId),
    getVirtualTourScenes(businessId),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-56 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/editar" />
        </aside>

        <div className="min-w-0 flex-1 lg:max-w-3xl">
          <div className="mb-6">
            <BackLink href="/dashboard" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Editar página comercial</h1>
          <p className="mt-2 text-[16px] text-muted">
            Plano atual: <strong>{business.effectivePlan}</strong>
            {business.trial.status === "active" && " (em teste)"}
          </p>

          <EditPageManager
            business={business}
            services={services}
            photos={photos}
            promotions={promotions}
            virtualTourScenes={virtualTourScenes}
            limits={limitsFor(business.effectivePlan)}
          />
        </div>
      </div>
    </main>
  );
}
