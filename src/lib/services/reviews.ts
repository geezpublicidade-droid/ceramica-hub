import { createServiceClient } from "@/lib/supabase/server";

export type ReviewStatus = "pendente" | "aprovado" | "rejeitado";

export type BusinessReview = {
  id: string;
  businessId: string;
  memberId: string;
  /** Nome público reduzido ("Maria S.") -- nunca o nome completo do membro,
   * por privacidade. O nome completo só aparece na moderação do admin. */
  memberDisplayName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
};

export type BusinessReviewAdminRow = BusinessReview & {
  memberFullName: string;
  memberEmail: string;
  businessName: string;
};

/** "Maria Silva Souza" -> "Maria S." -- primeiro nome + inicial do sobrenome. */
function publicDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function mapReview(row: Record<string, unknown>): BusinessReview {
  const member = row.members as { name: string } | null;
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    memberId: row.member_id as string,
    memberDisplayName: member ? publicDisplayName(member.name) : "Membro Cerâmica Hub",
    rating: row.rating as number,
    comment: row.comment as string,
    status: row.status as ReviewStatus,
    createdAt: row.created_at as string,
  };
}

/** Só "aprovado" aparece na página da empresa. */
export async function getApprovedReviews(businessId: string): Promise<BusinessReview[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_reviews")
    .select("*, members(name)")
    .eq("business_id", businessId)
    .eq("status", "aprovado")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

export async function getReviewStats(businessId: string): Promise<{ average: number; count: number }> {
  const reviews = await getApprovedReviews(businessId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average, count: reviews.length };
}

/** A própria avaliação do membro logado pra essa empresa, seja qual for o status -- pro formulário mostrar "sua avaliação está em análise" em vez de deixar reenviar sem perceber que já existe uma. */
export async function getMyReviewForBusiness(businessId: string, memberId: string): Promise<BusinessReview | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_reviews")
    .select("*, members(name)")
    .eq("business_id", businessId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReview(data) : null;
}

export async function getAllReviewsForAdmin(): Promise<BusinessReviewAdminRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_reviews")
    .select("*, members(name, email), businesses(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const member = row.members as { name: string; email: string } | null;
    const business = row.businesses as { name: string } | null;
    return {
      ...mapReview(row),
      memberFullName: member?.name ?? "—",
      memberEmail: member?.email ?? "—",
      businessName: business?.name ?? "—",
    };
  });
}
