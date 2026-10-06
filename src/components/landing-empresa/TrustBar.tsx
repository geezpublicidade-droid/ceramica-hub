import { Car, CalendarClock, MapPin, MessageCircle, ShieldCheck, Award, Clock3, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { LandingContext } from "./context";

type TrustItem = { icon: LucideIcon; title: string; sub: string };

/** Barra de confiança: até 4 itens, só os que a empresa preencheu (verificada e Espaço Cerâmica entram sempre que aplicáveis). */
export async function TrustBar({ ctx }: { ctx: LandingContext }) {
  const t = await getTranslations("LandingEmpresa");
  const { config } = ctx.data;

  const candidates: (TrustItem | null)[] = [
    ctx.business.verified ? { icon: ShieldCheck, title: t("verified"), sub: t("verifiedSub") } : null,
    { icon: MapPin, title: t("inEspaco"), sub: t("inEspacoSub") },
    config.yearsInBusiness ? { icon: Clock3, title: t("years", { count: config.yearsInBusiness }), sub: t("yearsSub") } : null,
    config.responseTime ? { icon: MessageCircle, title: t("fastReply"), sub: config.responseTime } : null,
    config.parkingInfo ? { icon: Car, title: t("parking"), sub: config.parkingInfo } : null,
    config.byAppointment ? { icon: CalendarClock, title: t("byAppointment"), sub: t("byAppointmentSub") } : null,
    config.professionalRegistry ? { icon: Award, title: t("registry"), sub: config.professionalRegistry } : null,
  ];
  const items = candidates.filter((item): item is TrustItem => item !== null).slice(0, 4);

  return (
    <section aria-label={t("verified")} className="border-y border-black/[0.06] bg-white">
      <ul className="container-page grid grid-cols-1 divide-y divide-black/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {items.map(({ icon: Icon, title, sub }) => (
          <li key={title} className="flex items-center gap-3.5 px-1 py-4 lg:px-6 lg:first:pl-0">
            <Icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.6} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-foreground">{title}</p>
              <p className="truncate text-[12.5px] text-muted">{sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
