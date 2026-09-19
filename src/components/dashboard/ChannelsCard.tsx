import type { Business } from "@/data/businesses";
import { limitsFor } from "@/lib/plan-limits";
import { StatusPill, type StatusPillTone } from "@/components/dashboard/StatusPill";

type Channel = { label: string; status: string; tone: StatusPillTone };

/** Cada canal reflete um mecanismo real da plataforma -- nada de status
 * inventado. "Promoções/Benefícios" é uma linha só (é a mesma tabela
 * `benefits` nos dois casos) e "Destaques" reflete a promessa de marketing
 * dos planos Destaque/Experiência, já que não existe curadoria/algoritmo de
 * destaque por empresa hoje (getFeaturedBusinesses só lista aprovadas). */
function publicVisibilityChannel(label: string, business: Business): Channel {
  if (business.status === "approved") return { label, status: "Ativo", tone: "positive" };
  if (business.status === "pending") return { label, status: "Aguardando publicação", tone: "pending" };
  return { label, status: "Inativo", tone: "neutral" };
}

export function ChannelsCard({
  business,
  hasActivePromotion,
}: {
  business: Business;
  hasActivePromotion: boolean;
}) {
  const limits = limitsFor(business.plan);
  const featuredLimits = limitsFor(business.effectivePlan);

  const publicVisibilityLabels = ["Perfil público", "Categoria da empresa", "Busca", "Torre ou localização"];

  const channels: Channel[] = [
    ...publicVisibilityLabels.map((label) => publicVisibilityChannel(label, business)),
    limits.maxPromotions === 0
      ? { label: "Promoções e benefícios", status: "Não incluído no plano", tone: "neutral" as const }
      : hasActivePromotion
        ? { label: "Promoções e benefícios", status: "Ativo", tone: "positive" as const }
        : { label: "Promoções e benefícios", status: "Requer configuração", tone: "pending" as const },
    featuredLimits.featuredAllowed
      ? { label: "Destaques", status: "Ativo", tone: "positive" as const }
      : { label: "Destaques", status: "Não incluído no plano", tone: "neutral" as const },
  ];

  const activeCount = channels.filter((channel) => channel.tone === "positive").length;

  return (
    <div className="glass-light rounded-3xl p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">
        Onde você está aparecendo
      </p>
      <p className="mt-2 text-[16px] text-foreground">
        Sua empresa está aparecendo em {activeCount} {activeCount === 1 ? "área" : "áreas"} do Cerâmica Hub.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {channels.map((channel) => (
          <li key={channel.label} className="flex items-center justify-between gap-3">
            <span className="text-[15px] text-foreground">{channel.label}</span>
            <StatusPill label={channel.status} tone={channel.tone} />
          </li>
        ))}
      </ul>
    </div>
  );
}
