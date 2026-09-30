import { createServiceClient } from "@/lib/supabase/server";

export type ContentKind =
  | "post"
  | "destaque_empresa"
  | "campanha"
  | "evento"
  | "data_comemorativa"
  | "newsletter"
  | "banner"
  | "publicacao_ancora";

export type ContentChannel =
  | "site"
  | "email"
  | "instagram"
  | "whatsapp"
  | "banner"
  | "carrossel_logos"
  | "pagina_empresa"
  | "eventos"
  | "midia_externa";

export type ContentStatus =
  | "ideia"
  | "planejamento"
  | "em_producao"
  | "aguardando_aprovacao"
  | "aprovado"
  | "agendado"
  | "publicado"
  | "cancelado";

export const CONTENT_KIND_LABEL: Record<ContentKind, string> = {
  post: "Post do Cerâmica Hub",
  destaque_empresa: "Destaque de empresa",
  campanha: "Campanha promocional",
  evento: "Evento",
  data_comemorativa: "Data comemorativa",
  newsletter: "Newsletter",
  banner: "Banner do site",
  publicacao_ancora: "Publicação de Âncora",
};

export const CONTENT_CHANNEL_LABEL: Record<ContentChannel, string> = {
  site: "Site",
  email: "E-mail",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  banner: "Banner",
  carrossel_logos: "Carrossel de logos",
  pagina_empresa: "Página da empresa",
  eventos: "Eventos",
  midia_externa: "Mídia externa",
};

export const CONTENT_STATUS_ORDER: ContentStatus[] = [
  "ideia",
  "planejamento",
  "em_producao",
  "aguardando_aprovacao",
  "aprovado",
  "agendado",
  "publicado",
  "cancelado",
];

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  ideia: "Ideia",
  planejamento: "Planejamento",
  em_producao: "Em produção",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  agendado: "Agendado",
  publicado: "Publicado",
  cancelado: "Cancelado",
};

export type ContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  briefing: string | null;
  body: string | null;
  channel: ContentChannel | null;
  status: ContentStatus;
  businessId: string | null;
  businessName: string | null;
  scheduledFor: string;
  publishedAt: string | null;
  ownerAdminId: string | null;
  ownerEmail: string | null;
  createdByEmail: string | null;
  updatedByEmail: string | null;
  approvedByEmail: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentVersion = {
  id: string;
  versionNumber: number;
  title: string;
  briefing: string | null;
  body: string | null;
  status: ContentStatus;
  changedByEmail: string | null;
  createdAt: string;
};

export type ContentComment = {
  id: string;
  adminEmail: string | null;
  body: string;
  createdAt: string;
};

type EmailRef = { email: string } | null;

type ItemRow = {
  id: string;
  kind: ContentKind;
  title: string;
  briefing: string | null;
  body: string | null;
  channel: ContentChannel | null;
  status: ContentStatus;
  business_id: string | null;
  scheduled_for: string;
  published_at: string | null;
  owner_admin_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  businesses: { name: string } | null;
  owner: EmailRef;
  creator: EmailRef;
  updater: EmailRef;
  approver: EmailRef;
};

const ITEM_SELECT =
  "id, kind, title, briefing, body, channel, status, business_id, scheduled_for, published_at, owner_admin_id, approved_at, created_at, updated_at, businesses(name), owner:admins!owner_admin_id(email), creator:admins!created_by(email), updater:admins!updated_by(email), approver:admins!approved_by(email)";

function mapItem(row: ItemRow): ContentItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    briefing: row.briefing,
    body: row.body,
    channel: row.channel,
    status: row.status,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? null,
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    ownerAdminId: row.owner_admin_id,
    ownerEmail: row.owner?.email ?? null,
    createdByEmail: row.creator?.email ?? null,
    updatedByEmail: row.updater?.email ?? null,
    approvedByEmail: row.approver?.email ?? null,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** `month` no formato YYYY-MM. */
export async function getContentItemsForMonth(month: string): Promise<ContentItem[]> {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  const { data, error } = await createServiceClient()
    .from("content_items")
    .select(ITEM_SELECT)
    .gte("scheduled_for", start)
    .lt("scheduled_for", end)
    .order("scheduled_for");
  if (error) throw error;
  return ((data ?? []) as unknown as ItemRow[]).map(mapItem);
}

export async function getContentItemById(id: string): Promise<ContentItem | null> {
  const { data, error } = await createServiceClient().from("content_items").select(ITEM_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapItem(data as unknown as ItemRow) : null;
}

export async function countContentAwaitingApproval(): Promise<number> {
  const { count, error } = await createServiceClient()
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "aguardando_aprovacao");
  if (error) throw error;
  return count ?? 0;
}

export type ContentItemInput = {
  kind: ContentKind;
  title: string;
  briefing: string | null;
  body: string | null;
  channel: ContentChannel | null;
  businessId: string | null;
  scheduledFor: string;
  ownerAdminId: string | null;
};

function itemColumns(input: ContentItemInput) {
  return {
    kind: input.kind,
    title: input.title.trim(),
    briefing: input.briefing?.trim() || null,
    body: input.body?.trim() || null,
    channel: input.channel,
    business_id: input.businessId,
    scheduled_for: input.scheduledFor,
    owner_admin_id: input.ownerAdminId,
  };
}

async function snapshotVersion(itemId: string, adminId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: item, error } = await supabase
    .from("content_items")
    .select("title, briefing, body, status")
    .eq("id", itemId)
    .single();
  if (error) throw error;
  const { count } = await supabase
    .from("content_item_versions")
    .select("id", { count: "exact", head: true })
    .eq("content_item_id", itemId);
  const { error: insertError } = await supabase.from("content_item_versions").insert({
    content_item_id: itemId,
    version_number: (count ?? 0) + 1,
    title: item.title,
    briefing: item.briefing,
    body: item.body,
    status: item.status,
    changed_by: adminId,
  });
  if (insertError) throw insertError;
}

export async function createContentItem(input: ContentItemInput, adminId: string): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("content_items")
    .insert({ ...itemColumns(input), created_by: adminId, updated_by: adminId })
    .select("id")
    .single();
  if (error) throw error;
  await snapshotVersion(data.id, adminId);
  return data.id;
}

export async function updateContentItem(id: string, input: ContentItemInput, adminId: string): Promise<void> {
  const { error } = await createServiceClient()
    .from("content_items")
    .update({ ...itemColumns(input), updated_by: adminId })
    .eq("id", id);
  if (error) throw error;
  await snapshotVersion(id, adminId);
}

export async function setContentStatus(id: string, status: ContentStatus, adminId: string): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_by: adminId };
  if (status === "aprovado") {
    patch.approved_by = adminId;
    patch.approved_at = new Date().toISOString();
  }
  if (status === "publicado") patch.published_at = new Date().toISOString();
  const { error } = await createServiceClient().from("content_items").update(patch).eq("id", id);
  if (error) throw error;
  await snapshotVersion(id, adminId);
}

export async function deleteContentItem(id: string): Promise<void> {
  const { error } = await createServiceClient().from("content_items").delete().eq("id", id);
  if (error) throw error;
}

export async function getContentVersions(itemId: string): Promise<ContentVersion[]> {
  const { data, error } = await createServiceClient()
    .from("content_item_versions")
    .select("id, version_number, title, briefing, body, status, created_at, changer:admins!changed_by(email)")
    .eq("content_item_id", itemId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    title: row.title,
    briefing: row.briefing,
    body: row.body,
    status: row.status as ContentStatus,
    changedByEmail: (row.changer as unknown as EmailRef)?.email ?? null,
    createdAt: row.created_at,
  }));
}

export async function getContentComments(itemId: string): Promise<ContentComment[]> {
  const { data, error } = await createServiceClient()
    .from("content_item_comments")
    .select("id, body, created_at, author:admins!admin_id(email)")
    .eq("content_item_id", itemId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    adminEmail: (row.author as unknown as EmailRef)?.email ?? null,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function addContentComment(itemId: string, adminId: string, body: string): Promise<void> {
  const { error } = await createServiceClient()
    .from("content_item_comments")
    .insert({ content_item_id: itemId, admin_id: adminId, body: body.trim() });
  if (error) throw error;
}
