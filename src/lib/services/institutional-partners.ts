import { createServiceClient } from "@/lib/supabase/server";

export type InstitutionalPartner = {
  id: string;
  name: string;
  logoUrl: string | null;
  link: string | null;
  partnershipType: string;
  authorizationNote: string | null;
  status: "rascunho" | "aguardando_autorizacao" | "aprovado" | "ativo" | "inativo";
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
};

function mapPartner(row: Record<string, unknown>): InstitutionalPartner {
  return {
    id: row.id as string,
    name: row.name as string,
    logoUrl: row.logo_url as string | null,
    link: row.link as string | null,
    partnershipType: row.partnership_type as string,
    authorizationNote: row.authorization_note as string | null,
    status: row.status as InstitutionalPartner["status"],
    startsAt: row.starts_at as string | null,
    endsAt: row.ends_at as string | null,
    sortOrder: row.sort_order as number,
  };
}

/** Só "ativo" aparece publicamente -- rascunho/aguardando/aprovado/inativo nunca vazam pra fora do admin. */
export async function getActivePartners(): Promise<InstitutionalPartner[]> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("institutional_partners")
    .select("*")
    .eq("status", "ativo")
    .or(`starts_at.is.null,starts_at.lte.${today}`)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPartner);
}

export async function getAllPartnersForAdmin(): Promise<InstitutionalPartner[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("institutional_partners")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPartner);
}
