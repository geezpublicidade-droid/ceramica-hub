import { createServiceClient } from "@/lib/supabase/server";
import type { Business } from "@/data/businesses";
import { categoryAndDescendantIds, type Category } from "@/lib/services/categories";

export type PlacementTypeKey = "leader" | "premium" | "featured";

export type CategoryPlacement = {
  id: string;
  typeKey: PlacementTypeKey;
  typeBadge: string;
  business: Business;
  offerText: string | null;
};

type PlacementRow = {
  id: string;
  business_id: string;
  category_id: string;
  position: number;
  rotation_weight: number;
  offer_text: string | null;
  placement_types: { key: PlacementTypeKey; badge_label: string; max_slots: number; sort_order: number; active: boolean };
};

export type VisiblePlacements = Record<PlacementTypeKey, CategoryPlacement[]>;

const TYPE_KEYS: PlacementTypeKey[] = ["leader", "premium", "featured"];

/** Data de hoje em São Paulo (YYYY-MM-DD): contrato vence no fim do dia local, não em UTC. */
function todaySaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/**
 * Sorteio ponderado sem reposição: quem tem `rotation_weight` maior tende a aparecer
 * mais, mas ninguém fica sempre fora. A ordem manual (`position`) vale como desempate
 * entre pesos iguais só quando não há excesso de anunciantes (nesse caso todos aparecem).
 */
export function pickWeighted<T extends { rotation_weight: number; position: number }>(items: T[], limit: number): T[] {
  if (items.length <= limit) return [...items].sort((a, b) => a.position - b.position);
  const pool = [...items];
  const chosen: T[] = [];
  while (chosen.length < limit && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + item.rotation_weight, 0);
    let ticket = Math.random() * total;
    const index = pool.findIndex((item) => (ticket -= item.rotation_weight) < 0);
    chosen.push(...pool.splice(index === -1 ? pool.length - 1 : index, 1));
  }
  return chosen;
}

/**
 * Posições comerciais visíveis agora numa categoria. Só entram contratos ativos,
 * com pagamento regular (pago ou isento), dentro do período, de empresa aprovada
 * e que realmente atua nessa categoria (vínculo com ela ou com uma descendente).
 * Vencido ou inadimplente = fora do resultado, sem precisar de rotina de limpeza.
 */
export async function getVisiblePlacements(
  category: Category,
  businessesById: Map<string, Business>,
  linksByBusiness: Map<string, Set<string>>,
): Promise<VisiblePlacements> {
  const empty: VisiblePlacements = { leader: [], premium: [], featured: [] };
  const today = todaySaoPaulo();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("category_placements")
    .select(
      "id, business_id, category_id, position, rotation_weight, offer_text, placement_types!inner(key, badge_label, max_slots, sort_order, active)",
    )
    .eq("category_id", category.id)
    .eq("status", "active")
    .in("payment_status", ["paid", "waived"])
    .lte("starts_at", today)
    .gte("ends_at", today);
  if (error) throw error;

  const allowedCategories = categoryAndDescendantIds(category);
  const eligible = ((data ?? []) as unknown as PlacementRow[]).filter((row) => {
    const business = businessesById.get(row.business_id);
    if (!business || !row.placement_types.active) return false;
    return [...(linksByBusiness.get(row.business_id) ?? [])].some((id) => allowedCategories.has(id));
  });

  const result = empty;
  for (const key of TYPE_KEYS) {
    const ofType = eligible.filter((row) => row.placement_types.key === key);
    if (ofType.length === 0) continue;
    const limit = ofType[0].placement_types.max_slots;
    result[key] = pickWeighted(ofType, limit).map((row) => ({
      id: row.id,
      typeKey: key,
      typeBadge: row.placement_types.badge_label,
      business: businessesById.get(row.business_id)!,
      offerText: row.offer_text,
    }));
  }
  return result;
}

/** Ids de empresas em algum bloco patrocinado (para não repetir na listagem orgânica). */
export function placedBusinessIds(placements: VisiblePlacements): Set<string> {
  return new Set(TYPE_KEYS.flatMap((key) => placements[key].map((placement) => placement.business.id)));
}
