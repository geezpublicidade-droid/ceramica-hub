import { createServiceClient } from "@/lib/supabase/server";
import { categoryBreadcrumb, getCategoryTree } from "@/lib/services/categories";
import {
  PLACEMENT_LIVE_LABEL,
  computeLiveState,
  daysBetween,
  todaySaoPaulo,
  type PaymentStatus,
  type PlacementLiveState,
  type PlacementStatus,
} from "@/lib/placement-rules";

/** Resultados atribuídos a UMA posição paga (nunca ao perfil inteiro): sem evento, 0. */
export type PlacementMetrics = {
  impressions: number;
  /** cliques nos botões do próprio card (perfil + WhatsApp) */
  cardClicks: number;
  profileViews: number;
  whatsapp: number;
  phone: number;
  website: number;
  directions: number;
  /** contatos gerados: WhatsApp + telefone */
  leads: number;
};

export const emptyPlacementMetrics = (): PlacementMetrics => ({
  impressions: 0,
  cardClicks: 0,
  profileViews: 0,
  whatsapp: 0,
  phone: 0,
  website: 0,
  directions: 0,
  leads: 0,
});

const EVENT_TYPES = [
  "placement_impression",
  "placement_click",
  "placement_profile_view",
  "whatsapp_clicked",
  "phone_clicked",
  "website_clicked",
  "directions_clicked",
];
const PAGE_SIZE = 1000;

type EventRow = { event_type: string; metadata: { placementId?: string; kind?: string } | null };

function addEvent(metrics: PlacementMetrics, row: EventRow) {
  switch (row.event_type) {
    case "placement_impression":
      metrics.impressions += 1;
      break;
    case "placement_click":
      metrics.cardClicks += 1;
      // o botão de WhatsApp do card já é um contato gerado
      if (row.metadata?.kind === "whatsapp") {
        metrics.whatsapp += 1;
        metrics.leads += 1;
      }
      break;
    case "placement_profile_view":
      metrics.profileViews += 1;
      break;
    case "whatsapp_clicked":
      metrics.whatsapp += 1;
      metrics.leads += 1;
      break;
    case "phone_clicked":
      metrics.phone += 1;
      metrics.leads += 1;
      break;
    case "website_clicked":
      metrics.website += 1;
      break;
    case "directions_clicked":
      metrics.directions += 1;
      break;
  }
}

/**
 * Métricas por posição no intervalo [from, to) (sem intervalo = tudo). Filtra por empresa quando
 * informada. Só entram eventos com `placementId` no metadata, então o perfil "orgânico" não conta.
 */
export async function getPlacementMetrics(options: { businessId?: string; from?: Date; to?: Date } = {}): Promise<Map<string, PlacementMetrics>> {
  const supabase = createServiceClient();
  const totals = new Map<string, PlacementMetrics>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("metrics_events")
      .select("event_type, metadata")
      .in("event_type", EVENT_TYPES)
      .not("metadata->>placementId", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (options.businessId) query = query.eq("business_id", options.businessId);
    if (options.from) query = query.gte("created_at", options.from.toISOString());
    if (options.to) query = query.lt("created_at", options.to.toISOString());

    const { data, error } = await query;
    if (error) throw error;
    for (const row of (data ?? []) as EventRow[]) {
      const id = row.metadata?.placementId;
      if (!id) continue;
      const metrics = totals.get(id) ?? emptyPlacementMetrics();
      addEvent(metrics, row);
      totals.set(id, metrics);
    }
    if ((data?.length ?? 0) < PAGE_SIZE) return totals;
  }
}

/** Taxa de cliques no card sobre as impressões; null sem impressão (evita 0% enganoso). */
export function placementCtr(metrics: PlacementMetrics): number | null {
  return metrics.impressions > 0 ? (metrics.cardClicks / metrics.impressions) * 100 : null;
}

export type BusinessPlacementResult = {
  id: string;
  typeName: string;
  categoryLabel: string;
  startsAt: string;
  endsAt: string;
  liveState: PlacementLiveState;
  liveLabel: string;
  daysLeft: number | null;
  metrics: PlacementMetrics;
};

/** Posições da empresa (menos canceladas) com os resultados do período, para o painel e o relatório mensal. */
export async function getBusinessPlacementResults(businessId: string, from: Date, to: Date): Promise<BusinessPlacementResult[]> {
  const supabase = createServiceClient();
  const [tree, rows, metrics] = await Promise.all([
    getCategoryTree(),
    supabase
      .from("category_placements")
      .select("id, category_id, starts_at, ends_at, status, payment_status, placement_types(name)")
      .eq("business_id", businessId)
      .neq("status", "cancelled")
      .order("ends_at", { ascending: false }),
    getPlacementMetrics({ businessId, from, to }),
  ]);
  if (rows.error) throw rows.error;
  const today = todaySaoPaulo();

  return (rows.data ?? []).map((row) => {
    const liveState = computeLiveState(
      { status: row.status as PlacementStatus, payment_status: row.payment_status as PaymentStatus, starts_at: row.starts_at, ends_at: row.ends_at },
      today,
    );
    const category = tree.byId.get(row.category_id);
    const daysLeft = row.ends_at >= today ? daysBetween(today, row.ends_at) : null;
    return {
      id: row.id,
      typeName: (row.placement_types as unknown as { name: string } | null)?.name ?? "Posição",
      categoryLabel: category ? categoryBreadcrumb(tree, category) : "Categoria",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      liveState,
      liveLabel: PLACEMENT_LIVE_LABEL[liveState],
      daysLeft,
      metrics: metrics.get(row.id) ?? emptyPlacementMetrics(),
    };
  });
}
