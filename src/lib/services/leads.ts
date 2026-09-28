import { createServiceClient } from "@/lib/supabase/server";

export type LeadStage =
  | "novo"
  | "primeiro_contato"
  | "qualificacao"
  | "reuniao_agendada"
  | "proposta_enviada"
  | "negociacao"
  | "fechado"
  | "perdido";

export const LEAD_STAGE_ORDER: LeadStage[] = [
  "novo",
  "primeiro_contato",
  "qualificacao",
  "reuniao_agendada",
  "proposta_enviada",
  "negociacao",
  "fechado",
  "perdido",
];

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  novo: "Novo lead",
  primeiro_contato: "Primeiro contato",
  qualificacao: "Qualificação",
  reuniao_agendada: "Reunião agendada",
  proposta_enviada: "Proposta enviada",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export type LeadSource =
  | "site"
  | "indicacao"
  | "prospeccao"
  | "evento"
  | "instagram"
  | "whatsapp"
  | "formulario"
  | "visita_presencial"
  | "parceiro"
  | "importacao";

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  site: "Site",
  indicacao: "Indicação",
  prospeccao: "Prospecção",
  evento: "Evento",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  formulario: "Formulário",
  visita_presencial: "Visita presencial",
  parceiro: "Parceiro",
  importacao: "Importação",
};

export type LeadTemperature = "frio" | "morno" | "quente";

export type Lead = {
  id: string;
  contactName: string;
  companyName: string | null;
  jobTitle: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  document: string | null;
  source: LeadSource;
  category: string | null;
  towerId: string | null;
  towerName: string | null;
  productInterest: string | null;
  planInterest: string | null;
  estimatedValueCents: number | null;
  temperature: LeadTemperature;
  stage: LeadStage;
  lossReason: string | null;
  ownerAdminId: string | null;
  ownerEmail: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  lastContactAt: string | null;
  notes: string | null;
  convertedBusinessId: string | null;
  createdAt: string;
  updatedAt: string;
};

type LeadRow = {
  id: string;
  contact_name: string;
  company_name: string | null;
  job_title: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  document: string | null;
  source: LeadSource;
  category: string | null;
  tower_id: string | null;
  product_interest: string | null;
  plan_interest: string | null;
  estimated_value_cents: number | null;
  temperature: LeadTemperature;
  stage: LeadStage;
  loss_reason: string | null;
  owner_admin_id: string | null;
  next_action: string | null;
  next_action_at: string | null;
  last_contact_at: string | null;
  notes: string | null;
  converted_business_id: string | null;
  created_at: string;
  updated_at: string;
  towers: { name: string } | null;
  admins: { email: string } | null;
};

const LEAD_SELECT =
  "id, contact_name, company_name, job_title, phone, whatsapp, email, document, source, category, tower_id, product_interest, plan_interest, estimated_value_cents, temperature, stage, loss_reason, owner_admin_id, next_action, next_action_at, last_contact_at, notes, converted_business_id, created_at, updated_at, towers(name), admins(email)";

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    contactName: row.contact_name,
    companyName: row.company_name,
    jobTitle: row.job_title,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    document: row.document,
    source: row.source,
    category: row.category,
    towerId: row.tower_id,
    towerName: row.towers?.name ?? null,
    productInterest: row.product_interest,
    planInterest: row.plan_interest,
    estimatedValueCents: row.estimated_value_cents,
    temperature: row.temperature,
    stage: row.stage,
    lossReason: row.loss_reason,
    ownerAdminId: row.owner_admin_id,
    ownerEmail: row.admins?.email ?? null,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    lastContactAt: row.last_contact_at,
    notes: row.notes,
    convertedBusinessId: row.converted_business_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as LeadRow[]).map(mapLead);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("leads").select(LEAD_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapLead(data as unknown as LeadRow) : null;
}

export type CreateLeadInput = {
  contactName: string;
  companyName?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  document?: string | null;
  source: LeadSource;
  category?: string | null;
  towerId?: string | null;
  productInterest?: string | null;
  planInterest?: string | null;
  estimatedValueCents?: number | null;
  temperature?: LeadTemperature;
  ownerAdminId?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  notes?: string | null;
};

export async function createLead(input: CreateLeadInput): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      contact_name: input.contactName,
      company_name: input.companyName ?? null,
      job_title: input.jobTitle ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      document: input.document ?? null,
      source: input.source,
      category: input.category ?? null,
      tower_id: input.towerId ?? null,
      product_interest: input.productInterest ?? null,
      plan_interest: input.planInterest ?? null,
      estimated_value_cents: input.estimatedValueCents ?? null,
      temperature: input.temperature ?? "morno",
      owner_admin_id: input.ownerAdminId ?? null,
      next_action: input.nextAction ?? null,
      next_action_at: input.nextActionAt ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar lead.");
  return data.id as string;
}
