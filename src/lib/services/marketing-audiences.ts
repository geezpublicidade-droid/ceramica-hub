import { createServiceClient } from "@/lib/supabase/server";

export type AudienceStatus = "ativo" | "inativo" | "todos";

/** Critérios de segmentação de empresas. Lista vazia / ausente = sem filtro
 * naquele critério. */
export type AudienceFilters = {
  categories?: string[];
  plans?: string[];
  towerIds?: string[];
  tags?: string[];
  status?: AudienceStatus;
  founderOnly?: boolean;
  signupFrom?: string;
  signupTo?: string;
};

export type Audience = {
  id: string;
  name: string;
  description: string | null;
  filters: AudienceFilters;
  createdAt: string;
};

export type AudienceRecipient = { businessId: string; name: string; email: string };

export type AudiencePreview = {
  matching: number;
  withConsent: number;
  recipients: AudienceRecipient[];
};

type BusinessRow = {
  id: string;
  name: string;
  email: string;
  category: string;
  plan: string;
  status: string;
  tower_id: string | null;
  founder: boolean;
  tags: string[] | null;
  created_at: string;
};

const ACTIVE_STATUS = "approved";

function matchesFilters(row: BusinessRow, filters: AudienceFilters): boolean {
  const { categories, plans, towerIds, tags, status = "ativo", founderOnly, signupFrom, signupTo } = filters;
  if (status === "ativo" && row.status !== ACTIVE_STATUS) return false;
  if (status === "inativo" && row.status !== "suspended") return false;
  if (categories?.length && !categories.includes(row.category)) return false;
  if (plans?.length && !plans.includes(row.plan)) return false;
  if (towerIds?.length && (!row.tower_id || !towerIds.includes(row.tower_id))) return false;
  if (tags?.length && !tags.some((tag) => row.tags?.includes(tag))) return false;
  if (founderOnly && !row.founder) return false;
  if (signupFrom && row.created_at.slice(0, 10) < signupFrom) return false;
  if (signupTo && row.created_at.slice(0, 10) > signupTo) return false;
  return true;
}

/** Empresas que casam com os filtros, já separando quem pode receber
 * marketing: consentimento ativo e fora da lista de descadastro. */
export async function previewAudience(filters: AudienceFilters): Promise<AudiencePreview> {
  const supabase = createServiceClient();
  const [businessesResult, consentsResult, unsubscribesResult] = await Promise.all([
    supabase.from("businesses").select("id, name, email, category, plan, status, tower_id, founder, tags, created_at"),
    supabase.from("email_consents").select("email").is("revoked_at", null),
    supabase.from("email_unsubscribes").select("email"),
  ]);
  if (businessesResult.error) throw businessesResult.error;
  if (consentsResult.error) throw consentsResult.error;
  if (unsubscribesResult.error) throw unsubscribesResult.error;

  const consented = new Set((consentsResult.data ?? []).map((row) => row.email.toLowerCase()));
  const unsubscribed = new Set((unsubscribesResult.data ?? []).map((row) => row.email.toLowerCase()));

  const matching = ((businessesResult.data ?? []) as BusinessRow[]).filter((row) => matchesFilters(row, filters));
  const recipients = matching
    .filter((row) => consented.has(row.email.toLowerCase()) && !unsubscribed.has(row.email.toLowerCase()))
    .map((row) => ({ businessId: row.id, name: row.name, email: row.email.toLowerCase() }));

  return { matching: matching.length, withConsent: recipients.length, recipients };
}

type AudienceRow = { id: string; name: string; description: string | null; filters: AudienceFilters; created_at: string };

function mapAudience(row: AudienceRow): Audience {
  return { id: row.id, name: row.name, description: row.description, filters: row.filters ?? {}, createdAt: row.created_at };
}

export async function getAllAudiences(): Promise<Audience[]> {
  const { data, error } = await createServiceClient()
    .from("marketing_audiences")
    .select("id, name, description, filters, created_at")
    .order("name");
  if (error) throw error;
  return ((data ?? []) as AudienceRow[]).map(mapAudience);
}

export async function getAudienceById(id: string): Promise<Audience | null> {
  const { data, error } = await createServiceClient()
    .from("marketing_audiences")
    .select("id, name, description, filters, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAudience(data as AudienceRow) : null;
}

export async function createAudience(
  input: { name: string; description: string | null; filters: AudienceFilters },
  adminId: string,
): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("marketing_audiences")
    .insert({ name: input.name.trim(), description: input.description?.trim() || null, filters: input.filters, created_by: adminId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteAudience(id: string): Promise<void> {
  const { error } = await createServiceClient().from("marketing_audiences").delete().eq("id", id);
  if (error) throw error;
}

/** Valores existentes pra montar os filtros: categorias e tags em uso, torres. */
export async function getAudienceFilterOptions(): Promise<{
  categories: string[];
  tags: string[];
  towers: { id: string; name: string }[];
}> {
  const supabase = createServiceClient();
  const [businessesResult, towersResult] = await Promise.all([
    supabase.from("businesses").select("category, tags"),
    supabase.from("towers").select("id, name").order("name"),
  ]);
  if (businessesResult.error) throw businessesResult.error;
  if (towersResult.error) throw towersResult.error;

  const rows = businessesResult.data ?? [];
  return {
    categories: Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).sort(),
    tags: Array.from(new Set(rows.flatMap((row) => (row.tags as string[] | null) ?? []))).sort(),
    towers: towersResult.data ?? [],
  };
}
