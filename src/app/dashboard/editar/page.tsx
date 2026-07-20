import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getBusinessById,
  getBusinessServices,
  getBusinessPhotos,
  getOwnedPromotions,
} from "@/lib/services/platform";
import { limitsFor } from "@/lib/plan-limits";
import { EditPageManager } from "@/components/dashboard/EditPageManager";

export const metadata = { title: "Editar página — Cerâmica Hub" };

export default async function EditarPaginaPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  const [services, photos, promotions] = await Promise.all([
    getBusinessServices(businessId),
    getBusinessPhotos(businessId),
    getOwnedPromotions(businessId),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Editar página comercial</h1>
        <p className="mt-2 text-[14px] text-muted">
          Plano atual: <strong>{business.effectivePlan}</strong>
          {business.trial.status === "active" && " (em teste)"}
        </p>

        <EditPageManager
          business={business}
          services={services}
          photos={photos}
          promotions={promotions}
          limits={limitsFor(business.effectivePlan)}
        />
      </div>
    </main>
  );
}
