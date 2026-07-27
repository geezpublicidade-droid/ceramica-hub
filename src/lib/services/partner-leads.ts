import { createServiceClient } from "@/lib/supabase/server";

export type PartnerLeadStatus = "novo" | "em_contato" | "convertido" | "descartado";

export type PartnerLead = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: PartnerLeadStatus;
  createdAt: string;
};

type PartnerLeadRow = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: PartnerLeadStatus;
  created_at: string;
};

function mapLead(row: PartnerLeadRow): PartnerLead {
  return {
    id: row.id,
    businessName: row.business_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getAllLeadsForAdmin(): Promise<PartnerLead[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("partner_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PartnerLeadRow[]).map(mapLead);
}
