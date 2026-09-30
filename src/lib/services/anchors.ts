import { createServiceClient } from "@/lib/supabase/server";

/** Empresas Âncoras (Fase 3.6): contrato anual, entregas e página com lojas. */

export type AnchorStatus = "ativo" | "encerrado" | "cancelado";
export type DeliverableStatus = "pendente" | "realizada" | "cancelada";

export const CONTRACT_STATUS_LABEL: Record<AnchorStatus, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export const DELIVERABLE_STATUS_LABEL: Record<DeliverableStatus, string> = {
  pendente: "Pendente",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export type AnchorContract = {
  id: string;
  partnerId: string;
  startsOn: string;
  endsOn: string;
  valueCents: number | null;
  status: AnchorStatus;
  notes: string | null;
};

export type AnchorDeliverable = {
  id: string;
  contractId: string;
  title: string;
  dueOn: string | null;
  status: DeliverableStatus;
  deliveredOn: string | null;
  evidenceUrl: string | null;
  notes: string | null;
};

export type ContractWithDeliverables = AnchorContract & { deliverables: AnchorDeliverable[] };

export type AnchorStore = {
  id: string;
  partnerId: string;
  name: string;
  segment: string | null;
  floor: string | null;
  description: string | null;
  logoUrl: string | null;
  instagram: string | null;
  website: string | null;
  active: boolean;
  highlightPaidUntil: string | null;
  highlightValueCents: number | null;
  sortOrder: number;
};

export type AnchorPartner = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  link: string | null;
  hasPage: boolean;
  status: string;
  tier: string;
  partnershipType: string;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Destaque só vale com pagamento registrado e dentro da vigência -- nunca por flag solta. */
export function isStoreHighlighted(store: Pick<AnchorStore, "highlightPaidUntil" | "highlightValueCents">, now = today()): boolean {
  return !!store.highlightPaidUntil && store.highlightPaidUntil >= now && (store.highlightValueCents ?? 0) > 0;
}

function mapPartner(row: Record<string, unknown>): AnchorPartner {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string | null,
    description: row.description as string | null,
    coverUrl: row.cover_url as string | null,
    logoUrl: row.logo_url as string | null,
    link: row.link as string | null,
    hasPage: row.has_page as boolean,
    status: row.status as string,
    tier: row.tier as string,
    partnershipType: row.partnership_type as string,
  };
}

function mapContract(row: Record<string, unknown>): AnchorContract {
  return {
    id: row.id as string,
    partnerId: row.partner_id as string,
    startsOn: row.starts_on as string,
    endsOn: row.ends_on as string,
    valueCents: row.value_cents as number | null,
    status: row.status as AnchorStatus,
    notes: row.notes as string | null,
  };
}

function mapDeliverable(row: Record<string, unknown>): AnchorDeliverable {
  return {
    id: row.id as string,
    contractId: row.contract_id as string,
    title: row.title as string,
    dueOn: row.due_on as string | null,
    status: row.status as DeliverableStatus,
    deliveredOn: row.delivered_on as string | null,
    evidenceUrl: row.evidence_url as string | null,
    notes: row.notes as string | null,
  };
}

function mapStore(row: Record<string, unknown>): AnchorStore {
  return {
    id: row.id as string,
    partnerId: row.partner_id as string,
    name: row.name as string,
    segment: row.segment as string | null,
    floor: row.floor as string | null,
    description: row.description as string | null,
    logoUrl: row.logo_url as string | null,
    instagram: row.instagram as string | null,
    website: row.website as string | null,
    active: row.active as boolean,
    highlightPaidUntil: row.highlight_paid_until as string | null,
    highlightValueCents: row.highlight_value_cents as number | null,
    sortOrder: row.sort_order as number,
  };
}

export async function getAnchorPartnerById(id: string): Promise<AnchorPartner | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("institutional_partners").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapPartner(data) : null;
}

/** Página pública: só parceiro "ativo" e com página habilitada -- mesma regra de publicação de /parceiros. */
export async function getPublicAnchorBySlug(slug: string): Promise<AnchorPartner | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("institutional_partners")
    .select("*")
    .eq("slug", slug)
    .eq("has_page", true)
    .eq("status", "ativo")
    .maybeSingle();
  if (error) throw error;
  return data ? mapPartner(data) : null;
}

export async function getAnchorStores(partnerId: string, options: { onlyActive: boolean }): Promise<AnchorStore[]> {
  const supabase = createServiceClient();
  let query = supabase.from("anchor_stores").select("*").eq("partner_id", partnerId);
  if (options.onlyActive) query = query.eq("active", true);
  const { data, error } = await query.order("sort_order").order("name");
  if (error) throw error;
  return (data ?? []).map(mapStore);
}

/** Lojas pra página pública: destaque pago primeiro, o resto em ordem alfabética/manual. */
export async function getPublicStores(partnerId: string): Promise<(AnchorStore & { highlighted: boolean })[]> {
  const stores = await getAnchorStores(partnerId, { onlyActive: true });
  return stores
    .map((store) => ({ ...store, highlighted: isStoreHighlighted(store) }))
    .sort((a, b) => Number(b.highlighted) - Number(a.highlighted));
}

export async function getContractsWithDeliverables(partnerId: string): Promise<ContractWithDeliverables[]> {
  const supabase = createServiceClient();
  const { data: contracts, error } = await supabase
    .from("anchor_contracts")
    .select("*")
    .eq("partner_id", partnerId)
    .order("starts_on", { ascending: false });
  if (error) throw error;
  if (!contracts?.length) return [];

  const { data: deliverables, error: delError } = await supabase
    .from("anchor_deliverables")
    .select("*")
    .in("contract_id", contracts.map((c) => c.id))
    .order("due_on", { ascending: true, nullsFirst: false });
  if (delError) throw delError;

  return contracts.map((contract) => ({
    ...mapContract(contract),
    deliverables: (deliverables ?? []).filter((d) => d.contract_id === contract.id).map(mapDeliverable),
  }));
}

export type DeliverableProgress = { total: number; done: number; pending: number; overdue: number; percentage: number };

/** Cancelada não conta no total; pendente com prazo vencido conta como atrasada. */
export function getDeliverableProgress(deliverables: AnchorDeliverable[], now = today()): DeliverableProgress {
  const active = deliverables.filter((d) => d.status !== "cancelada");
  const done = active.filter((d) => d.status === "realizada").length;
  const pending = active.length - done;
  const overdue = active.filter((d) => d.status === "pendente" && d.dueOn && d.dueOn < now).length;
  return { total: active.length, done, pending, overdue, percentage: active.length ? Math.round((done / active.length) * 100) : 0 };
}

/** Âncoras que têm contrato ativo vencendo nos próximos `days` dias (alimenta a automação de renovação). */
export async function getContractsExpiringSoon(days: number): Promise<(AnchorContract & { partnerName: string })[]> {
  const supabase = createServiceClient();
  const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("anchor_contracts")
    .select("*, institutional_partners(name)")
    .eq("status", "ativo")
    .gte("ends_on", today())
    .lte("ends_on", limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapContract(row),
    partnerName: (row.institutional_partners as unknown as { name: string } | null)?.name ?? "Âncora",
  }));
}
