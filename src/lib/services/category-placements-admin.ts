import { createServiceClient } from "@/lib/supabase/server";
import {
  computeLiveState,
  todaySaoPaulo,
  type PaymentStatus,
  type PlacementLiveState,
  type PlacementStatus,
} from "@/lib/placement-rules";
import {
  categoryAndDescendantIds,
  categoryBreadcrumb,
  getBusinessCategoryLinks,
  getCategoryTree,
  type Category,
} from "@/lib/services/categories";

export type PlacementType = {
  id: string;
  key: string;
  name: string;
  maxSlots: number;
  exclusive: boolean;
  defaultRotationWeight: number;
  productId: string | null;
  monthlyPriceCents: number | null;
};

export type AdminPlacement = {
  id: string;
  businessId: string;
  businessName: string;
  categoryId: string;
  categoryLabel: string;
  typeId: string;
  typeName: string;
  position: number;
  rotationWeight: number;
  startsAt: string;
  endsAt: string;
  status: PlacementStatus;
  paymentStatus: PaymentStatus;
  amountCents: number | null;
  offerText: string | null;
  contractRef: string | null;
  proposalId: string | null;
  marketingCampaignId: string | null;
  notes: string | null;
  liveState: PlacementLiveState;
};

export type PlacementInput = {
  businessId: string;
  categoryId: string;
  placementTypeId: string;
  startsAt: string;
  endsAt: string;
  amountCents: number | null;
  rotationWeight: number;
  position: number;
  offerText: string | null;
  contractRef: string | null;
  proposalId: string | null;
  marketingCampaignId: string | null;
  notes: string | null;
  paymentStatus: PaymentStatus;
};

export async function getPlacementTypes(): Promise<PlacementType[]> {
  const { data, error } = await createServiceClient()
    .from("placement_types")
    .select("id, key, name, max_slots, exclusive, default_rotation_weight, product_id, products(monthly_price_cents)")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    maxSlots: row.max_slots,
    exclusive: row.exclusive,
    defaultRotationWeight: row.default_rotation_weight,
    productId: row.product_id,
    monthlyPriceCents: (row.products as unknown as { monthly_price_cents: number | null } | null)?.monthly_price_cents ?? null,
  }));
}

export async function listAdminPlacements(): Promise<AdminPlacement[]> {
  const [tree, rows] = await Promise.all([
    getCategoryTree(),
    createServiceClient()
      .from("category_placements")
      .select(
        "id, business_id, category_id, placement_type_id, position, rotation_weight, starts_at, ends_at, status, payment_status, amount_cents, offer_text, contract_ref, proposal_id, marketing_campaign_id, notes, businesses(name), placement_types(name)",
      )
      .order("ends_at", { ascending: false }),
  ]);
  if (rows.error) throw rows.error;
  const today = todaySaoPaulo();

  return (rows.data ?? []).map((row) => {
    const category = tree.byId.get(row.category_id);
    return {
      id: row.id,
      businessId: row.business_id,
      businessName: (row.businesses as unknown as { name: string } | null)?.name ?? "—",
      categoryId: row.category_id,
      categoryLabel: category ? categoryBreadcrumb(tree, category) : "Categoria removida",
      typeId: row.placement_type_id,
      typeName: (row.placement_types as unknown as { name: string } | null)?.name ?? "—",
      position: row.position,
      rotationWeight: row.rotation_weight,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      paymentStatus: row.payment_status,
      amountCents: row.amount_cents,
      offerText: row.offer_text,
      contractRef: row.contract_ref,
      proposalId: row.proposal_id,
      marketingCampaignId: row.marketing_campaign_id,
      notes: row.notes,
      liveState: computeLiveState(row, today),
    };
  });
}

export type InventoryCell = { typeId: string; occupied: number; maxSlots: number };
export type InventoryRow = { categoryId: string; label: string; level: number; cells: InventoryCell[] };

/** Vagas por categoria × tipo hoje: quantas posições vigentes (reservada, ativa ou suspensa) cobrem a data atual. */
export async function getPlacementInventory(types: PlacementType[], placements: AdminPlacement[]): Promise<InventoryRow[]> {
  const tree = await getCategoryTree();
  const today = todaySaoPaulo();
  const live = placements.filter(
    (p) => ["reserved", "active", "paused"].includes(p.status) && p.startsAt <= today && p.endsAt >= today,
  );

  const rows: InventoryRow[] = [];
  const walk = (nodes: typeof tree.roots, prefix: string) => {
    for (const node of nodes) {
      const label = prefix ? `${prefix} › ${node.name}` : node.name;
      // especialidades (nível 3) ficam fora do inventário: posição vale a partir da subcategoria
      if (node.level <= 2) {
        rows.push({
          categoryId: node.id,
          label,
          level: node.level,
          cells: types.map((type) => ({
            typeId: type.id,
            maxSlots: type.maxSlots,
            occupied: live.filter((p) => p.categoryId === node.id && p.typeId === type.id).length,
          })),
        });
        walk(node.children, label);
      }
    }
  };
  walk(tree.roots, "");
  return rows;
}

/** Erro de domínio devolvido ao admin (mensagem pronta para exibir). */
export class PlacementError extends Error {}

async function assertBusinessActsInCategory(businessId: string, categoryId: string) {
  const [tree, links, business] = await Promise.all([
    getCategoryTree(),
    getBusinessCategoryLinks(),
    createServiceClient().from("businesses").select("status").eq("id", businessId).maybeSingle(),
  ]);
  if (business.error) throw business.error;
  if (business.data?.status !== "approved") throw new PlacementError("A empresa precisa estar aprovada.");
  const category = tree.byId.get(categoryId);
  if (!category) throw new PlacementError("Categoria não encontrada.");
  const allowed = categoryAndDescendantIds(category);
  const linked = [...(links.get(businessId) ?? [])].some((id) => allowed.has(id));
  if (!linked) {
    throw new PlacementError(
      "A empresa não atua nesta categoria. Vincule a empresa à categoria (ou a uma subcategoria dela) antes de vender a posição.",
    );
  }
}

function translateDbError(error: { code?: string; message: string }): never {
  // 23P01 = vaga exclusiva ocupada / estouro de vagas (constraint + trigger da migration 0068)
  if (error.code === "23P01") throw new PlacementError(error.message.replace(/^.*?:\s*/, "") || "Conflito de vaga no período.");
  throw new Error(error.message);
}

export async function createPlacement(input: PlacementInput): Promise<string> {
  await assertBusinessActsInCategory(input.businessId, input.categoryId);
  const { data, error } = await createServiceClient()
    .from("category_placements")
    .insert({
      business_id: input.businessId,
      category_id: input.categoryId,
      placement_type_id: input.placementTypeId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      amount_cents: input.amountCents,
      rotation_weight: input.rotationWeight,
      position: input.position,
      offer_text: input.offerText,
      contract_ref: input.contractRef,
      proposal_id: input.proposalId,
      marketing_campaign_id: input.marketingCampaignId,
      notes: input.notes,
      payment_status: input.paymentStatus,
      status: "reserved",
    })
    .select("id")
    .single();
  if (error) translateDbError(error);
  return data!.id as string;
}

export type PlacementPatch = Partial<{
  status: PlacementStatus;
  paymentStatus: PaymentStatus;
  startsAt: string;
  endsAt: string;
  rotationWeight: number;
  position: number;
  offerText: string | null;
  amountCents: number | null;
}>;

export async function updatePlacement(id: string, patch: PlacementPatch): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.paymentStatus !== undefined) update.payment_status = patch.paymentStatus;
  if (patch.startsAt !== undefined) update.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) update.ends_at = patch.endsAt;
  if (patch.rotationWeight !== undefined) update.rotation_weight = patch.rotationWeight;
  if (patch.position !== undefined) update.position = patch.position;
  if (patch.offerText !== undefined) update.offer_text = patch.offerText;
  if (patch.amountCents !== undefined) update.amount_cents = patch.amountCents;
  const { error } = await createServiceClient().from("category_placements").update(update).eq("id", id);
  if (error) translateDbError(error);
}

/** Renovação: estende o término em `months` meses a partir do fim atual (ou de hoje, se já venceu) e reativa. */
export async function renewPlacement(id: string, months: number): Promise<void> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("category_placements").select("ends_at").eq("id", id).single();
  if (error) throw error;
  const today = todaySaoPaulo();
  const base = new Date(`${data.ends_at < today ? today : data.ends_at}T00:00:00Z`);
  base.setUTCMonth(base.getUTCMonth() + months);
  await updatePlacement(id, { endsAt: base.toISOString().slice(0, 10), status: "active" });
}

export type PlacementFormOptions = {
  businesses: { id: string; name: string }[];
  categories: { id: string; label: string }[];
  types: PlacementType[];
  proposals: { id: string; businessId: string | null; label: string }[];
  campaigns: { id: string; businessId: string | null; label: string }[];
};

/** Listas para o formulário de nova posição: só empresas aprovadas e categorias até o nível de subcategoria. */
export async function getPlacementFormOptions(): Promise<PlacementFormOptions> {
  const supabase = createServiceClient();
  const [tree, types, businesses, proposals, campaigns] = await Promise.all([
    getCategoryTree(),
    getPlacementTypes(),
    supabase.from("businesses").select("id, name").eq("status", "approved").order("name"),
    supabase.from("proposals").select("id, number, client_name, business_id").order("number", { ascending: false }).limit(200),
    supabase.from("marketing_campaigns").select("id, name, business_id").order("created_at", { ascending: false }).limit(200),
  ]);
  for (const result of [businesses, proposals, campaigns]) if (result.error) throw result.error;

  const categories: { id: string; label: string }[] = [];
  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      if (node.level > 2) continue;
      categories.push({ id: node.id, label: categoryBreadcrumb(tree, node) });
      walk(node.children);
    }
  };
  walk(tree.roots);

  return {
    businesses: (businesses.data ?? []).map((row) => ({ id: row.id, name: row.name })),
    categories,
    types,
    proposals: (proposals.data ?? []).map((row) => ({
      id: row.id,
      businessId: row.business_id,
      label: `#${row.number} · ${row.client_name}`,
    })),
    campaigns: (campaigns.data ?? []).map((row) => ({ id: row.id, businessId: row.business_id, label: row.name })),
  };
}
