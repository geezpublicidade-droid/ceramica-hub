import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { getBusinessById, getBusinessPhotos, getOpportunities, getOwnedPromotions } from "@/lib/services/platform";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { getOverviewData } from "@/lib/services/overview-data";
import { getStoreSpaces } from "@/lib/services/ad-store";
import { getPublicationOffers } from "@/lib/services/publication-store";
import { discountFor } from "@/lib/ad-plan-benefits";
import { formatCents, formatDateBR } from "@/lib/utils";

export const metadata = { title: "Oportunidades — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const card = "glass-card-light rounded-2xl p-5";

export default async function OportunidadesPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const permissions = await getCompanyPermissions(businessId);
  const plan = permissions?.plan ?? "presenca";
  const [business, photos, promotions, spaces, offers, hubOpportunities] = await Promise.all([
    getBusinessById(businessId),
    getBusinessPhotos(businessId),
    getOwnedPromotions(businessId),
    getStoreSpaces().catch(() => []),
    getPublicationOffers(businessId, plan).catch(() => []),
    getOpportunities().catch(() => []),
  ]);
  const overview = business
    ? await getOverviewData({ businessId, plan, photoCount: photos.length, hasActivePromotion: promotions.some((p) => p.active) }).catch(() => null)
    : null;
  const discount = discountFor(plan);
  const freeSpaces = spaces.filter((space) => space.nextFreeStart).slice(0, 6);
  const nextSlots = offers.flatMap((offer) => offer.slots.slice(0, 1).map((slot) => ({ name: offer.product.name, ...slot, includedLeft: offer.includedLeft })));

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/oportunidades" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div>
            <BackLink href="/dashboard" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Oportunidades</h1>
            <p className="mt-2 text-[16px] text-muted">Onde você ainda pode divulgar, o que o Hub sugere e o que as outras empresas estão buscando.</p>
          </div>

          <section className={card}>
            <h2 className="text-[16px] font-semibold text-foreground">Sugestões para você</h2>
            {!overview || overview.recommendations.length === 0 ? (
              <p className="mt-2 text-[14px] text-muted">Nenhuma sugestão agora. Quando houver algo a melhorar, aparece aqui.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {overview.recommendations.map((item) => (
                  <li key={item.id} className="text-[14px]">
                    <p>{item.text}</p>
                    <Link href={item.href} className="font-medium text-primary hover:underline">{item.cta} →</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="text-[16px] font-semibold text-foreground">Espaços com data livre</h2>
            {freeSpaces.length === 0 ? (
              <p className="mt-2 text-[14px] text-muted">Nenhum espaço com data livre nos próximos meses.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {freeSpaces.map((space) => (
                  <li key={space.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]">
                    <span>
                      <strong>{space.name}</strong>
                      <span className="block text-[12px] text-muted">{space.locationLabel} · livre a partir de {formatDateBR(space.nextFreeStart as string)}</span>
                    </span>
                    <span className="font-semibold text-primary">{formatCents(space.monthlyPriceCents)}/mês{discount > 0 && ` (−${discount}%)`}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/anuncios" className="mt-3 inline-block text-[14px] font-medium text-primary hover:underline">Ver todos e reservar →</Link>
          </section>

          {nextSlots.length > 0 && (
            <section className={card}>
              <h2 className="text-[16px] font-semibold text-foreground">Próximas datas para publicar</h2>
              <ul className="mt-3 flex flex-col gap-2 text-[14px]">
                {nextSlots.map((slot) => (
                  <li key={slot.name}>
                    <strong>{slot.name}</strong>: {formatDateBR(slot.date)}{slot.time && ` às ${slot.time}`}
                    {slot.includedLeft > 0 && <span className="ml-1 text-emerald-700">(incluído no seu plano)</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hubOpportunities.length > 0 && (
            <section className={card}>
              <h2 className="text-[16px] font-semibold text-foreground">Rede de negócios do Hub</h2>
              <p className="mt-1 text-[13px] text-muted">Oportunidades publicadas por outras empresas do Complexo.</p>
              <ul className="mt-3 flex flex-col gap-3 text-[14px]">
                {hubOpportunities.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <span className="block text-[12px] text-muted">{item.business.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
