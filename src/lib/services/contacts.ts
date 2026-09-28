import { createServiceClient } from "@/lib/supabase/server";

/** Contato comercial de uma empresa (aba "Contatos" da Empresa 360°) --
 * distinto de `business_staff` (login de verdade no painel da empresa). Ver
 * supabase/migrations/0050_contacts.sql. */
export type Contact = {
  id: string;
  businessId: string;
  businessName: string | null;
  name: string;
  jobTitle: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ContactRow = {
  id: string;
  business_id: string;
  name: string;
  job_title: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  businesses: { name: string } | null;
};

const CONTACT_SELECT =
  "id, business_id, name, job_title, phone, whatsapp, email, is_primary, notes, created_at, updated_at, businesses(name)";

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? null,
    name: row.name,
    jobTitle: row.job_title,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    isPrimary: row.is_primary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllContactsForAdmin(): Promise<Contact[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ContactRow[]).map(mapContact);
}

export async function getContactsByBusiness(businessId: string): Promise<Contact[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ContactRow[]).map(mapContact);
}

export type CreateContactInput = {
  businessId: string;
  name: string;
  jobTitle?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
};

export async function createContact(input: CreateContactInput): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      business_id: input.businessId,
      name: input.name,
      job_title: input.jobTitle ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      is_primary: input.isPrimary ?? false,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar contato.");
  return data.id as string;
}

export type UpdateContactInput = Partial<Omit<CreateContactInput, "businessId">>;

export async function updateContact(id: string, input: UpdateContactInput): Promise<void> {
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.jobTitle !== undefined) patch.job_title = input.jobTitle || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.whatsapp !== undefined) patch.whatsapp = input.whatsapp || null;
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.isPrimary !== undefined) patch.is_primary = input.isPrimary;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  const { error } = await supabase.from("contacts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}
