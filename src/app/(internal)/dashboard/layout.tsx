import { auth } from "@/auth";
import { PlanProvider } from "@/components/plans/PlanProvider";
import { SupportWhatsAppButton } from "@/components/support/SupportWhatsAppButton";
import { getPlanProviderValue } from "@/lib/services/plan-provider-data";

/** Todo o painel da empresa lê o plano pelo mesmo provider (plano em vigor + recursos): nada de verificar o nome do plano em cada tela. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  const plan = businessId ? await getPlanProviderValue(businessId) : null;

  return (
    <>
      {plan ? <PlanProvider value={plan}>{children}</PlanProvider> : children}
      <SupportWhatsAppButton />
    </>
  );
}
