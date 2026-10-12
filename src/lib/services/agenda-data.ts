import { createServiceClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/ad-schedule";
import { campaignStage, publicationStage } from "@/lib/ad-stage";
import type { AgendaItem } from "@/lib/agenda";
import { getUpcomingEvents } from "@/lib/services/events";

const toDate = (value: string) => value.slice(0, 10);

/** Reúne num só formato tudo o que está marcado para a empresa: anúncios, publicações, promoções, destaques em categoria e eventos do Hub. */
export async function getAgendaItems(businessId: string, from: string, to: string): Promise<AgendaItem[]> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const [campaigns, publications, promotions, placements, events] = await Promise.all([
    supabase
      .from("ad_campaigns")
      .select("id, title, starts_at, ends_at, status, payment_status, ad_placements(name)")
      .eq("business_id", businessId)
      .neq("status", "draft")
      .lte("starts_at", to)
      .gte("ends_at", from),
    supabase
      .from("publication_bookings")
      .select("id, title, scheduled_for, time_slot, status, payment_status, publication_products(name)")
      .eq("business_id", businessId)
      .neq("status", "cancelado")
      .gte("scheduled_for", from)
      .lte("scheduled_for", to),
    supabase.from("benefits").select("id, title, valid_until, active").eq("business_id", businessId).not("valid_until", "is", null).gte("valid_until", from).lte("valid_until", to),
    supabase
      .from("category_placements")
      .select("id, starts_at, ends_at, status, payment_status, categories(name), placement_types(name)")
      .eq("business_id", businessId)
      .neq("status", "cancelled")
      .lte("starts_at", to)
      .gte("ends_at", from),
    getUpcomingEvents().catch(() => []),
  ]);
  for (const result of [campaigns, publications, promotions, placements]) if (result.error) throw result.error;

  const items: AgendaItem[] = [];
  for (const row of campaigns.data ?? []) {
    const stage = campaignStage({ status: row.status, paymentStatus: row.payment_status, startsAt: row.starts_at, endsAt: row.ends_at }, today);
    items.push({
      id: `ad-${row.id}`,
      kind: "anuncio",
      title: row.title,
      date: row.starts_at,
      endDate: row.ends_at,
      tone: stage.tone,
      detail: `${(row.ad_placements as unknown as { name: string } | null)?.name ?? "Espaço"} · ${stage.label}`,
      href: "/dashboard/anuncios",
    });
  }
  for (const row of publications.data ?? []) {
    const stage = publicationStage({ status: row.status, paymentStatus: row.payment_status, scheduledFor: row.scheduled_for });
    items.push({
      id: `pub-${row.id}`,
      kind: "publicacao",
      title: row.title,
      date: row.scheduled_for,
      time: row.time_slot || undefined,
      tone: stage.tone,
      detail: `${(row.publication_products as unknown as { name: string } | null)?.name ?? "Publicação"} · ${stage.label}`,
      href: "/dashboard/anuncios",
    });
  }
  for (const row of promotions.data ?? []) {
    items.push({
      id: `promo-${row.id}`,
      kind: "promocao",
      title: `Fim da promoção: ${row.title}`,
      date: row.valid_until as string,
      tone: !row.active || (row.valid_until as string) < today ? "gray" : "blue",
      detail: row.active ? "Promoção termina neste dia" : "Promoção inativa",
      href: "/dashboard/editar?tab=promocoes",
    });
  }
  for (const row of placements.data ?? []) {
    const pending = row.status === "reserved" && ["pending", "overdue"].includes(row.payment_status);
    items.push({
      id: `cat-${row.id}`,
      kind: "destaque_categoria",
      title: `${(row.placement_types as unknown as { name: string } | null)?.name ?? "Destaque"} em ${(row.categories as unknown as { name: string } | null)?.name ?? "categoria"}`,
      date: row.starts_at,
      endDate: row.ends_at,
      tone: pending ? "yellow" : row.status === "active" ? "green" : row.status === "reserved" ? "blue" : "gray",
      detail: pending ? "Aguardando pagamento" : row.status === "active" ? "No ar" : row.status === "reserved" ? "Agendado" : "Encerrado",
      href: "/dashboard/resultados",
    });
  }
  for (const event of events) {
    const date = toDate(event.startsAt);
    if (date < from || date > to) continue;
    items.push({ id: `evt-${event.id}`, kind: "evento", title: event.title, date, endDate: event.endsAt ? toDate(event.endsAt) : undefined, tone: "blue", detail: event.location ?? "Evento do Hub", href: "/forum-de-negocios" });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Janela padrão para a linha do tempo do painel inicial. */
export function timelineWindow(today: string): { from: string; to: string } {
  return { from: today, to: addDays(today, 30) };
}
