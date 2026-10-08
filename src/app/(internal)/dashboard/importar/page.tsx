import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";
import { getLandingConfig } from "@/lib/services/landing";
import { GoogleImportPanel } from "@/components/dashboard/GoogleImportPanel";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import type { CurrentProfileValues } from "@/lib/profile/import-fields";

export const metadata = { title: "Importar do Google — Cerâmica Hub" };

export default async function ImportFromGooglePage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  const config = await getLandingConfig(business.id);
  const current: CurrentProfileValues = {
    shortDescription: business.description ?? "",
    whatsapp: config.whatsappPhone ?? "",
    schedule: config.openingSchedule,
    websiteUrl: business.websiteUrl ?? "",
    instagram: business.instagram ?? "",
    parkingInfo: config.parkingInfo ?? "",
    accessibilityInfo: config.accessibilityInfo ?? "",
  };

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/importar" />
        </aside>
        <div className="min-w-0 max-w-2xl flex-1">
          <div className="mb-6">
            <BackLink href="/dashboard" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Importar do Google</h1>
          <p className="mt-2 text-[16px] text-muted">
            Encontre sua empresa no Google e escolha, campo a campo, o que trazer para o seu perfil. Nada é alterado sem você marcar.
          </p>
          <div className="mt-6">
            <GoogleImportPanel current={current} />
          </div>
        </div>
      </div>
    </main>
  );
}
