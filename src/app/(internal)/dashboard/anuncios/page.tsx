import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { AdSpaceCard } from "@/components/dashboard/ads/AdSpaceCard";
import { MyCampaignsList } from "@/components/dashboard/ads/MyCampaignsList";
import { getMyCampaigns, getStoreSpaces } from "@/lib/services/ad-store";
import { getBusinessById } from "@/lib/services/platform";

export const metadata = { title: "Anunciar — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function AnunciosPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");
  const isOwner = !session?.user?.isStaff;

  const [spaces, campaigns, business] = await Promise.all([getStoreSpaces(), getMyCampaigns(businessId), getBusinessById(businessId)]);
  const today = new Date().toISOString().slice(0, 10);
  const defaultUrl = business?.slug ? `/empresa/${business.slug}` : "";

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/anuncios" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div>
            <BackLink href="/dashboard" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Anunciar no Cerâmica Hub</h1>
            <p className="mt-2 text-[16px] text-muted">
              Escolha o espaço, veja onde seu anúncio vai aparecer e quais datas estão livres, envie a arte e reserve. A publicação e a retirada acontecem sozinhas nas datas contratadas.
            </p>
          </div>

          <MyCampaignsList campaigns={campaigns} today={today} canCancel={isOwner} />

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">Espaços disponíveis</h2>
            {!isOwner && <p className="text-[14px] text-muted">Somente o responsável pela empresa pode reservar espaços.</p>}
            {spaces.length === 0 ? (
              <p className="text-[15px] text-muted">Nenhum espaço aberto para reserva agora.</p>
            ) : (
              spaces.map((space) => <AdSpaceCard key={space.id} space={space} today={today} defaultUrl={defaultUrl} />)
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
