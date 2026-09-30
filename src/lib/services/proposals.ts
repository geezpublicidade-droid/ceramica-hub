import { createServiceClient } from "@/lib/supabase/server";

export type ProposalStatus = "rascunho" | "enviada" | "visualizada" | "negociacao" | "aceita" | "recusada" | "vencida";
export type ProposalPeriod = "mensal" | "anual" | "unico" | "personalizado";

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  negociacao: "Em negociação",
  aceita: "Aceita",
  recusada: "Recusada",
  vencida: "Vencida",
};

export const PROPOSAL_STATUS_ORDER: ProposalStatus[] = [
  "rascunho",
  "enviada",
  "visualizada",
  "negociacao",
  "aceita",
  "recusada",
  "vencida",
];

/** Status em que a proposta ainda está "no ar" (pode vencer ou ser decidida). */
const OPEN_STATUSES: ProposalStatus[] = ["enviada", "visualizada", "negociacao"];
/** Status finais: a proposta não pode mais ser editada. */
export const FINAL_STATUSES: ProposalStatus[] = ["aceita", "recusada", "vencida"];

export type ProposalItem = {
  id: string;
  productId: string | null;
  name: string;
  period: ProposalPeriod;
  unitPriceCents: number;
  quantity: number;
};

export type ProposalEvent = {
  id: string;
  adminEmail: string | null;
  eventType: string;
  detail: string | null;
  createdAt: string;
};

export type Proposal = {
  id: string;
  number: number;
  kind: "nova" | "renovacao";
  leadId: string | null;
  businessId: string | null;
  clientName: string;
  clientEmail: string | null;
  status: ProposalStatus;
  validUntil: string | null;
  discountPercent: number;
  discountCents: number;
  terms: string | null;
  notes: string | null;
  publicToken: string;
  ownerAdminId: string | null;
  ownerEmail: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  items: ProposalItem[];
  subtotalCents: number;
  totalCents: number;
};

type ItemRow = {
  id: string;
  product_id: string | null;
  name: string;
  period: ProposalPeriod;
  unit_price_cents: number;
  quantity: number;
};

type ProposalRow = {
  id: string;
  number: number;
  kind: "nova" | "renovacao";
  lead_id: string | null;
  business_id: string | null;
  client_name: string;
  client_email: string | null;
  status: ProposalStatus;
  valid_until: string | null;
  discount_percent: number | string;
  discount_cents: number;
  terms: string | null;
  notes: string | null;
  public_token: string;
  owner_admin_id: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  decided_at: string | null;
  created_at: string;
  admins: { email: string } | null;
  proposal_items: ItemRow[];
};

const PROPOSAL_SELECT =
  "id, number, kind, lead_id, business_id, client_name, client_email, status, valid_until, discount_percent, discount_cents, terms, notes, public_token, owner_admin_id, sent_at, viewed_at, decided_at, created_at, admins(email), proposal_items(id, product_id, name, period, unit_price_cents, quantity)";

/** Subtotal, desconto e total (em centavos) — fonte única do cálculo, usada
 * no formulário, na página da proposta e no link público. */
export function computeTotals(
  items: { unitPriceCents: number; quantity: number }[],
  discountPercent: number,
  discountCents: number,
): { subtotalCents: number; discountTotalCents: number; totalCents: number } {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const discountTotalCents = Math.min(subtotalCents, Math.round((subtotalCents * discountPercent) / 100) + discountCents);
  return { subtotalCents, discountTotalCents, totalCents: subtotalCents - discountTotalCents };
}

function mapProposal(row: ProposalRow): Proposal {
  const items = row.proposal_items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.name,
    period: item.period,
    unitPriceCents: item.unit_price_cents,
    quantity: item.quantity,
  }));
  const discountPercent = Number(row.discount_percent);
  const { subtotalCents, totalCents } = computeTotals(items, discountPercent, row.discount_cents);
  return {
    id: row.id,
    number: row.number,
    kind: row.kind,
    leadId: row.lead_id,
    businessId: row.business_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    status: row.status,
    validUntil: row.valid_until,
    discountPercent,
    discountCents: row.discount_cents,
    terms: row.terms,
    notes: row.notes,
    publicToken: row.public_token,
    ownerAdminId: row.owner_admin_id,
    ownerEmail: row.admins?.email ?? null,
    sentAt: row.sent_at,
    viewedAt: row.viewed_at,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    items,
    subtotalCents,
    totalCents,
  };
}

/** Marca como "vencida" as propostas em aberto cuja validade já passou.
 * Chamado ao listar/abrir — evita depender de um cron. */
export async function expireOverdueProposals(): Promise<void> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("proposals")
    .update({ status: "vencida", decided_at: new Date().toISOString() })
    .in("status", OPEN_STATUSES)
    .lt("valid_until", today)
    .select("id");
  if (error) throw error;
  if (data?.length) {
    await supabase
      .from("proposal_events")
      .insert(data.map((row) => ({ proposal_id: row.id, event_type: "status", detail: "Vencida automaticamente (validade expirou)." })));
  }
}

export async function getAllProposals(): Promise<Proposal[]> {
  await expireOverdueProposals();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("proposals").select(PROPOSAL_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ProposalRow[]).map(mapProposal);
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  await expireOverdueProposals();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("proposals").select(PROPOSAL_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProposal(data as unknown as ProposalRow) : null;
}

export async function getProposalByToken(token: string): Promise<Proposal | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("proposals").select(PROPOSAL_SELECT).eq("public_token", token).maybeSingle();
  if (error) throw error;
  return data ? mapProposal(data as unknown as ProposalRow) : null;
}

export async function getProposalsByBusiness(businessId: string): Promise<Proposal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ProposalRow[]).map(mapProposal);
}

export async function getProposalEvents(proposalId: string): Promise<ProposalEvent[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("proposal_events")
    .select("id, event_type, detail, created_at, admins(email)")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as { id: string; event_type: string; detail: string | null; created_at: string; admins: { email: string } | null }[]).map(
    (row) => ({
      id: row.id,
      adminEmail: row.admins?.email ?? null,
      eventType: row.event_type,
      detail: row.detail,
      createdAt: row.created_at,
    }),
  );
}

export async function addProposalEvent(proposalId: string, adminId: string | null, eventType: string, detail: string | null): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("proposal_events").insert({ proposal_id: proposalId, admin_id: adminId, event_type: eventType, detail });
  if (error) throw error;
}

export type ProposalItemInput = {
  productId: string | null;
  name: string;
  period: ProposalPeriod;
  unitPriceCents: number;
  quantity: number;
};

/** Campos editáveis de uma proposta (usado em criar e editar). */
export type ProposalInput = {
  leadId: string | null;
  businessId: string | null;
  clientName: string;
  clientEmail: string | null;
  validUntil: string | null;
  discountPercent: number;
  discountCents: number;
  terms: string | null;
  notes: string | null;
  ownerAdminId: string | null;
  items: ProposalItemInput[];
};

function itemRows(proposalId: string, items: ProposalItemInput[]) {
  return items.map((item, index) => ({
    proposal_id: proposalId,
    product_id: item.productId,
    name: item.name,
    period: item.period,
    unit_price_cents: item.unitPriceCents,
    quantity: item.quantity,
    sort_order: index,
  }));
}

function proposalColumns(input: ProposalInput) {
  return {
    lead_id: input.leadId,
    business_id: input.businessId,
    client_name: input.clientName,
    client_email: input.clientEmail,
    valid_until: input.validUntil,
    discount_percent: input.discountPercent,
    discount_cents: input.discountCents,
    terms: input.terms,
    notes: input.notes,
    owner_admin_id: input.ownerAdminId,
  };
}

export async function createProposal(input: ProposalInput, kind: "nova" | "renovacao" = "nova"): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("proposals")
    .insert({ ...proposalColumns(input), kind })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar proposta.");
  const id = data.id as string;
  const { error: itemsError } = await supabase.from("proposal_items").insert(itemRows(id, input.items));
  if (itemsError) {
    await supabase.from("proposals").delete().eq("id", id);
    throw itemsError;
  }
  return id;
}

export async function updateProposal(id: string, input: ProposalInput): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("proposals").update(proposalColumns(input)).eq("id", id);
  if (error) throw error;
  const { error: deleteError } = await supabase.from("proposal_items").delete().eq("proposal_id", id);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from("proposal_items").insert(itemRows(id, input.items));
  if (insertError) throw insertError;
}

/** Atualiza o status e carimba a data correspondente (enviada/decisão). */
export async function setProposalStatus(id: string, status: ProposalStatus): Promise<void> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "enviada") patch.sent_at = now;
  if (status === "aceita" || status === "recusada" || status === "vencida") patch.decided_at = now;
  const { error } = await supabase.from("proposals").update(patch).eq("id", id);
  if (error) throw error;
}

/** Registra a visualização do cliente (só a primeira) e avança de "enviada"
 * pra "visualizada". Não mexe em propostas já em negociação/decididas. */
export async function markProposalViewed(id: string, status: ProposalStatus): Promise<void> {
  if (status !== "enviada") return;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("proposals")
    .update({ status: "visualizada", viewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "enviada");
  if (error) throw error;
  await addProposalEvent(id, null, "status", "Cliente visualizou a proposta pelo link.");
}
