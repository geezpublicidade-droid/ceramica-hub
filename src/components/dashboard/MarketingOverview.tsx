import Link from "next/link";
import { TONE_DOT } from "@/components/dashboard/agenda/AgendaCalendar";
import { AGENDA_KIND_LABEL, type AgendaItem } from "@/lib/agenda";
import { conversionRate } from "@/lib/overview-stats";
import { describeChange, percentChange } from "@/lib/marketing-recommendations";
import { formatDateBR } from "@/lib/utils";
import type { OverviewData } from "@/lib/services/overview-data";

type Props = { data: OverviewData; planName: string; renewsAt: string | null; pageHref: string | null };

function Kpi({ label, value, change }: { label: string; value: string; change?: number | null }) {
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {change != null && (
        <p className={`text-[12px] font-medium ${change >= 0 ? "text-emerald-700" : "text-red-700"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs. mês anterior
        </p>
      )}
    </div>
  );
}

function TimelineList({ items, empty }: { items: AgendaItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-[14px] text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.slice(0, 6).map((item) => (
        <li key={item.id} className="flex items-start gap-2 text-[14px]">
          <i className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[item.tone]}`} />
          <span>
            <strong>{item.title}</strong>
            <span className="block text-[12px] text-muted">
              {AGENDA_KIND_LABEL[item.kind]} · {formatDateBR(item.date)}{item.time ? ` às ${item.time}` : ""}{item.detail ? ` · ${item.detail}` : ""}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Central de marketing: o que aconteceu, o que está programado e o que fazer a seguir, em uma tela. */
export function MarketingOverview({ data, planName, renewsAt, pageHref }: Props) {
  const { stats, leads, today, timeline, recommendations } = data;
  const { current, previous } = stats;
  const conversion = conversionRate(current, leads.current);
  const viewsChange = percentChange(current.views, previous.views);
  const headline = describeChange("visualizações", viewsChange);

  return (
    <section className="flex flex-col gap-5" aria-label="Central de marketing">
      <div className="glass-light rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] uppercase tracking-[0.18em] text-muted">Central de marketing · últimos 30 dias</p>
            <p className="mt-1 text-[15px] text-foreground">
              Plano <strong>{planName}</strong>
              {renewsAt && <> · renovação em {formatDateBR(renewsAt)}</>}
            </p>
          </div>
          {pageHref && <Link href={pageHref} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">Ver minha página</Link>}
        </div>
        {headline && <p className="mt-3 text-[16px] font-medium text-foreground">{headline}</p>}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kpi label="Visualizações do perfil" value={String(current.views)} change={viewsChange} />
          <Kpi label="Cliques no WhatsApp" value={String(current.whatsapp)} change={percentChange(current.whatsapp, previous.whatsapp)} />
          <Kpi label="Pedidos de rota" value={String(current.routes)} change={percentChange(current.routes, previous.routes)} />
          <Kpi label="Contatos recebidos (leads)" value={String(leads.current)} change={percentChange(leads.current, leads.previous)} />
          <Kpi label="Cupons utilizados" value={String(current.coupons)} change={percentChange(current.coupons, previous.coupons)} />
          <Kpi label="Taxa de conversão" value={conversion === null ? "—" : `${String(conversion).replace(".", ",")}%`} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="glass-card-light rounded-2xl p-5">
          <h2 className="text-[16px] font-semibold text-foreground">Hoje</h2>
          <p className="mt-1 text-[14px] text-muted">
            {today.views} visualização(ões) e {today.contacts} contato(s) até agora.
          </p>
          <div className="mt-3"><TimelineList items={timeline.today} empty="Nada programado para hoje." /></div>
          <h2 className="mt-5 text-[16px] font-semibold text-foreground">Próximos dias</h2>
          <div className="mt-3"><TimelineList items={timeline.upcoming} empty="Nenhuma divulgação programada para as próximas duas semanas." /></div>
          <Link href="/dashboard/agenda" className="mt-4 inline-block text-[14px] font-medium text-primary hover:underline">Abrir agenda de divulgação →</Link>
        </div>

        <div className="glass-card-light rounded-2xl p-5">
          <h2 className="text-[16px] font-semibold text-foreground">Próxima ação recomendada</h2>
          {recommendations.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">Tudo em dia por aqui. Novas sugestões aparecem quando houver algo a melhorar.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-4">
              {recommendations.slice(0, 4).map((item) => (
                <li key={item.id} className="text-[14px]">
                  <p className="text-foreground">{item.text}</p>
                  <Link href={item.href} className="mt-1 inline-block font-medium text-primary hover:underline">{item.cta} →</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
