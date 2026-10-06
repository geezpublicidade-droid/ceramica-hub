import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";
import { getLandingEditorData } from "@/lib/services/landing-editor-data";
import { LandingEditor } from "@/components/dashboard/landing/LandingEditor";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Landing page da empresa — Cerâmica Hub" };

export default async function LandingPageEditorPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  const data = await getLandingEditorData(business);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/landing" />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <BackLink href="/dashboard" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Landing page da empresa</h1>
          <p className="mt-2 max-w-2xl text-[16px] text-muted">
            Monte a página que seus clientes veem em <strong>/empresa/{business.slug}</strong>: apresentação, serviços, oferta, galeria, localização, perguntas e contato.
          </p>
          <div className="mt-6">
            <LandingEditor data={data} previewHref={`/empresa/${business.slug}/preview`} publicHref={`/empresa/${business.slug}`} />
          </div>
        </div>
      </div>
    </main>
  );
}
