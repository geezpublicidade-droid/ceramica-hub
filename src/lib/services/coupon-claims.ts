import { createServiceClient } from "@/lib/supabase/server";
import { normalizeClaimToken, type ClaimStatus } from "@/lib/services/coupon-token";

/** Clube de benefícios (Fase 5.3): cupom revelado → QR Code → validação pela empresa. */

type BenefitRow = {
  id: string;
  business_id: string;
  active: boolean;
  coupon_code: string | null;
  valid_until: string | null;
  max_total_uses: number | null;
  businesses: { status: string } | null;
};

export type ClaimResult = { success: true; code: string; token: string; status: ClaimStatus; businessId: string } | { success: false; error: string };

/** Revela o cupom para o membro. Idempotente: quem já revelou recebe o mesmo token. */
export async function claimCoupon(memberId: string, benefitId: string): Promise<ClaimResult> {
  const supabase = createServiceClient();
  const { data: benefit, error } = await supabase
    .from("benefits")
    .select("id, business_id, active, coupon_code, valid_until, max_total_uses, businesses!inner(status)")
    .eq("id", benefitId)
    .maybeSingle<BenefitRow>();
  if (error) throw error;
  if (!benefit || !benefit.active || !benefit.coupon_code || benefit.businesses?.status !== "approved") {
    return { success: false, error: "Esse cupom não está mais disponível." };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (benefit.valid_until && benefit.valid_until < today) return { success: false, error: "Esse cupom já venceu." };

  const existing = await supabase.from("coupon_claims").select("token, status").eq("benefit_id", benefitId).eq("member_id", memberId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return { success: true, code: benefit.coupon_code, token: existing.data.token, status: existing.data.status, businessId: benefit.business_id };

  const inserted = await supabase
    .from("coupon_claims")
    .insert({ benefit_id: benefitId, member_id: memberId, business_id: benefit.business_id })
    .select("id, token, status")
    .single();
  if (inserted.error) {
    // Dois cliques ao mesmo tempo: o segundo bate na unicidade e só relê o primeiro.
    if (inserted.error.code === "23505") return claimCoupon(memberId, benefitId);
    throw inserted.error;
  }

  // O limite é conferido depois de inserir: se estourou (inclusive por corrida), esta linha desfaz a si mesma.
  if (benefit.max_total_uses !== null) {
    const { count, error: countError } = await supabase
      .from("coupon_claims")
      .select("id", { count: "exact", head: true })
      .eq("benefit_id", benefitId);
    if (countError) throw countError;
    if ((count ?? 0) > benefit.max_total_uses) {
      await supabase.from("coupon_claims").delete().eq("id", inserted.data.id);
      return { success: false, error: "Esse cupom esgotou." };
    }
  }

  return { success: true, code: benefit.coupon_code, token: inserted.data.token, status: inserted.data.status, businessId: benefit.business_id };
}

export type ValidatedClaim = { benefitTitle: string; memberName: string };
export type ValidateResult = { success: true; claim: ValidatedClaim } | { success: false; error: string };

type ClaimRow = {
  id: string;
  status: ClaimStatus;
  business_id: string;
  benefits: { title: string; valid_until: string | null } | null;
  members: { name: string } | null;
};

/** A empresa confirma o cupom no balcão. Só vale para cupons da própria empresa, uma única vez. */
export async function validateClaim(businessId: string, rawToken: string): Promise<ValidateResult> {
  const token = normalizeClaimToken(rawToken);
  if (!token) return { success: false, error: "Código inválido." };

  const supabase = createServiceClient();
  const { data: claim, error } = await supabase
    .from("coupon_claims")
    .select("id, status, business_id, benefits(title, valid_until), members(name)")
    .eq("token", token)
    .maybeSingle<ClaimRow>();
  if (error) throw error;
  if (!claim || claim.business_id !== businessId) return { success: false, error: "Cupom não encontrado nesta empresa." };
  if (claim.status === "utilizado") return { success: false, error: "Esse cupom já foi utilizado." };
  const today = new Date().toISOString().slice(0, 10);
  if (claim.benefits?.valid_until && claim.benefits.valid_until < today) return { success: false, error: "Esse cupom venceu." };

  const { data: updated, error: updateError } = await supabase
    .from("coupon_claims")
    .update({ status: "utilizado", used_at: new Date().toISOString() })
    .eq("id", claim.id)
    .eq("status", "revelado")
    .select("id")
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) return { success: false, error: "Esse cupom já foi utilizado." };

  return { success: true, claim: { benefitTitle: claim.benefits?.title ?? "Cupom", memberName: claim.members?.name ?? "Membro" } };
}

export type BenefitStats = { benefitId: string; title: string; active: boolean; maxTotalUses: number | null; issued: number; used: number };
export type RecentClaim = { id: string; benefitTitle: string; memberName: string; status: ClaimStatus; claimedAt: string; usedAt: string | null };

type StatsClaimRow = {
  id: string;
  benefit_id: string;
  status: ClaimStatus;
  claimed_at: string;
  used_at: string | null;
  benefits: { title: string } | null;
  members: { name: string } | null;
};

const RECENT_LIMIT = 30;

/** Emitidos × utilizados por benefício e os últimos resgates, para o painel da empresa. */
export async function getBusinessCouponStats(businessId: string): Promise<{ benefits: BenefitStats[]; recent: RecentClaim[] }> {
  const supabase = createServiceClient();
  const [benefits, claims] = await Promise.all([
    supabase.from("benefits").select("id, title, active, max_total_uses").eq("business_id", businessId).not("coupon_code", "is", null),
    supabase
      .from("coupon_claims")
      .select("id, benefit_id, status, claimed_at, used_at, benefits(title), members(name)")
      .eq("business_id", businessId)
      .order("claimed_at", { ascending: false })
      .returns<StatsClaimRow[]>(),
  ]);
  if (benefits.error) throw benefits.error;
  if (claims.error) throw claims.error;
  const rows = claims.data ?? [];

  return {
    benefits: (benefits.data ?? []).map((benefit) => {
      const own = rows.filter((claim) => claim.benefit_id === benefit.id);
      return {
        benefitId: benefit.id,
        title: benefit.title,
        active: benefit.active,
        maxTotalUses: benefit.max_total_uses,
        issued: own.length,
        used: own.filter((claim) => claim.status === "utilizado").length,
      };
    }),
    recent: rows.slice(0, RECENT_LIMIT).map((claim) => ({
      id: claim.id,
      benefitTitle: claim.benefits?.title ?? "Cupom",
      memberName: claim.members?.name ?? "Membro",
      status: claim.status,
      claimedAt: claim.claimed_at,
      usedAt: claim.used_at,
    })),
  };
}

/** Quantos cupons de cada benefício já foram emitidos (para esconder cupom esgotado na vitrine). */
export async function getIssuedCounts(benefitIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (benefitIds.length === 0) return counts;
  const { data, error } = await createServiceClient().from("coupon_claims").select("benefit_id").in("benefit_id", benefitIds);
  if (error) throw error;
  for (const row of data ?? []) counts.set(row.benefit_id, (counts.get(row.benefit_id) ?? 0) + 1);
  return counts;
}
