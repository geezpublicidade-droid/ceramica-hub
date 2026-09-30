import type { AdminRole } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type AdminSearchGroup = "Empresas" | "Contatos" | "Leads" | "Tarefas" | "Propostas";

export type AdminSearchResult = {
  group: AdminSearchGroup;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

const RESULTS_PER_GROUP = 5;
const MIN_TERM_LENGTH = 2;

// Mesmos papéis que enxergam a página correspondente no AdminNav.
const GROUP_ROLES: Record<AdminSearchGroup, AdminRole[]> = {
  Empresas: ["super_admin", "admin", "moderador", "comercial", "financeiro", "marketing", "atendimento", "analista"],
  Contatos: ["super_admin", "admin", "comercial", "atendimento"],
  Leads: ["super_admin", "admin", "comercial"],
  Tarefas: ["super_admin", "admin", "comercial", "atendimento", "marketing", "financeiro"],
  Propostas: ["super_admin", "admin", "comercial"],
};

/** Tira caracteres que têm significado na sintaxe de filtro do PostgREST
 * (`,` separa condições do `.or()`, `%` e `_` são curingas do ilike). */
function sanitizeTerm(raw: string): string {
  return raw.replace(/[,%_()\\]/g, " ").replace(/\s+/g, " ").trim();
}

function orIlike(columns: string[], term: string): string {
  return columns.map((column) => `${column}.ilike.%${term}%`).join(",");
}

function joinParts(...parts: (string | null | undefined)[]): string | null {
  return parts.filter(Boolean).join(" · ") || null;
}

type Searcher = (term: string) => Promise<AdminSearchResult[]>;

const searchCompanies: Searcher = async (term) => {
  const { data, error } = await createServiceClient()
    .from("businesses")
    .select("id, name, email, category")
    .or(orIlike(["name", "email", "responsible_name", "document"], term))
    .order("name")
    .limit(RESULTS_PER_GROUP);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    group: "Empresas",
    id: row.id,
    title: row.name,
    subtitle: joinParts(row.category, row.email),
    href: `/admin/empresas/${row.id}`,
  }));
};

const searchContacts: Searcher = async (term) => {
  const { data, error } = await createServiceClient()
    .from("contacts")
    .select("id, business_id, name, email, businesses(name)")
    .or(orIlike(["name", "email", "phone", "whatsapp"], term))
    .order("name")
    .limit(RESULTS_PER_GROUP);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    group: "Contatos",
    id: row.id,
    title: row.name,
    subtitle: joinParts((row.businesses as unknown as { name: string } | null)?.name, row.email),
    href: `/admin/empresas/${row.business_id}`,
  }));
};

const searchLeads: Searcher = async (term) => {
  const { data, error } = await createServiceClient()
    .from("leads")
    .select("id, contact_name, company_name, email")
    .or(orIlike(["contact_name", "company_name", "email", "phone", "whatsapp"], term))
    .order("created_at", { ascending: false })
    .limit(RESULTS_PER_GROUP);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    group: "Leads",
    id: row.id,
    title: row.contact_name,
    subtitle: joinParts(row.company_name, row.email),
    href: "/admin/leads",
  }));
};

const searchTasks: Searcher = async (term) => {
  const { data, error } = await createServiceClient()
    .from("tasks")
    .select("id, title, description")
    .or(orIlike(["title", "description"], term))
    .order("created_at", { ascending: false })
    .limit(RESULTS_PER_GROUP);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    group: "Tarefas",
    id: row.id,
    title: row.title,
    subtitle: row.description,
    href: "/admin/tarefas",
  }));
};

const searchProposals: Searcher = async (term) => {
  // Número da proposta é inteiro: "12" ou "#12" também busca por número exato.
  const numeric = Number(term.replace(/^#/, ""));
  const byName = orIlike(["client_name", "client_email"], term);
  const filter = Number.isInteger(numeric) && numeric > 0 ? `${byName},number.eq.${numeric}` : byName;
  const { data, error } = await createServiceClient()
    .from("proposals")
    .select("id, number, client_name, status")
    .or(filter)
    .order("created_at", { ascending: false })
    .limit(RESULTS_PER_GROUP);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    group: "Propostas",
    id: row.id,
    title: `#${row.number} · ${row.client_name}`,
    subtitle: row.status,
    href: `/admin/propostas/${row.id}`,
  }));
};

const SEARCHERS: Record<AdminSearchGroup, Searcher> = {
  Empresas: searchCompanies,
  Contatos: searchContacts,
  Leads: searchLeads,
  Tarefas: searchTasks,
  Propostas: searchProposals,
};

/** Busca global do admin: consulta em paralelo só os grupos que o papel pode
 * ver. Um grupo que falha não derruba os outros (retorna vazio + log). */
export async function searchAdmin(rawTerm: string, role: AdminRole): Promise<AdminSearchResult[]> {
  const term = sanitizeTerm(rawTerm);
  if (term.length < MIN_TERM_LENGTH) return [];

  const groups = (Object.keys(SEARCHERS) as AdminSearchGroup[]).filter(
    (group) => role === "super_admin" || GROUP_ROLES[group].includes(role),
  );
  const settled = await Promise.allSettled(groups.map((group) => SEARCHERS[group](term)));

  return settled.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`[admin-search] falha em ${groups[index]}:`, result.reason);
    return [];
  });
}
