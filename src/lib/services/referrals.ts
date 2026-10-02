import { createServiceClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/seo";
import { normalizeReferralCode } from "@/lib/services/referral-code";

/** Programa de indicações (Fase 5.2). */

export type ReferrerType = "business" | "member";
export type ReferralStatus = "cadastrada" | "convertida";
export type RewardStatus = "nenhuma" | "pendente" | "concedida";

const REFERRER_TABLE: Record<ReferrerType, "businesses" | "members"> = { business: "businesses", member: "members" };
export function referralLink(code: string): string {
  return `${siteUrl}/cadastro?ref=${code}`;
}

type Referrer = { type: ReferrerType; id: string };

async function findReferrer(code: string): Promise<Referrer | null> {
  const supabase = createServiceClient();
  for (const type of ["business", "member"] as const) {
    const { data, error } = await supabase.from(REFERRER_TABLE[type]).select("id").eq("referral_code", code).maybeSingle();
    if (error) throw error;
    if (data) return { type, id: data.id };
  }
  return null;
}

/** Registra que a empresa nova veio por um código. Código inválido ou autoindicação são ignorados sem erro. */
export async function recordReferral(referredBusinessId: string, rawCode: string | null | undefined): Promise<void> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return;
  const referrer = await findReferrer(code);
  if (!referrer || (referrer.type === "business" && referrer.id === referredBusinessId)) return;
  const { error } = await createServiceClient()
    .from("referrals")
    .insert({ referrer_type: referrer.type, referrer_id: referrer.id, referred_business_id: referredBusinessId });
  if (error && error.code !== "23505") throw error;
}

/** Primeiro pagamento confirmado da empresa indicada: indicação vira "convertida" e a recompensa fica pendente. */
export async function markReferralConverted(referredBusinessId: string): Promise<void> {
  const { error } = await createServiceClient()
    .from("referrals")
    .update({ status: "convertida", reward_status: "pendente", converted_at: new Date().toISOString() })
    .eq("referred_business_id", referredBusinessId)
    .eq("status", "cadastrada");
  if (error) throw error;
}

export type ReferralEntry = {
  id: string;
  referredName: string;
  status: ReferralStatus;
  rewardStatus: RewardStatus;
  rewardNote: string | null;
  createdAt: string;
};

export type ReferralSummary = {
  code: string;
  link: string;
  entries: ReferralEntry[];
  registered: number;
  converted: number;
};

type ReferralRow = {
  id: string;
  status: ReferralStatus;
  reward_status: RewardStatus;
  reward_note: string | null;
  created_at: string;
  businesses: { name: string } | null;
};

const toEntry = (row: ReferralRow): ReferralEntry => ({
  id: row.id,
  referredName: row.businesses?.name ?? "Empresa removida",
  status: row.status,
  rewardStatus: row.reward_status,
  rewardNote: row.reward_note,
  createdAt: row.created_at,
});

export async function getReferralSummary(type: ReferrerType, id: string): Promise<ReferralSummary> {
  const supabase = createServiceClient();
  const [account, referrals] = await Promise.all([
    supabase.from(REFERRER_TABLE[type]).select("referral_code").eq("id", id).single(),
    supabase
      .from("referrals")
      .select("id, status, reward_status, reward_note, created_at, businesses!referred_business_id(name)")
      .eq("referrer_type", type)
      .eq("referrer_id", id)
      .order("created_at", { ascending: false })
      .returns<ReferralRow[]>(),
  ]);
  if (account.error) throw account.error;
  if (referrals.error) throw referrals.error;
  const entries = (referrals.data ?? []).map(toEntry);
  const code = account.data.referral_code as string;
  return {
    code,
    link: referralLink(code),
    entries,
    registered: entries.length,
    converted: entries.filter((entry) => entry.status === "convertida").length,
  };
}

export type RankingRow = {
  type: ReferrerType;
  id: string;
  name: string;
  registered: number;
  converted: number;
  pendingRewards: number;
};

type AdminReferralRow = ReferralRow & { referrer_type: ReferrerType; referrer_id: string };

export type AdminReferralEntry = ReferralEntry & { referrerName: string };

async function referrerNames(supabase: ReturnType<typeof createServiceClient>, rows: AdminReferralRow[]) {
  const names = new Map<string, string>();
  await Promise.all(
    (["business", "member"] as const).map(async (type) => {
      const ids = [...new Set(rows.filter((row) => row.referrer_type === type).map((row) => row.referrer_id))];
      if (ids.length === 0) return;
      const { data, error } = await supabase.from(REFERRER_TABLE[type]).select("id, name").in("id", ids);
      if (error) throw error;
      for (const account of data ?? []) names.set(`${type}:${account.id}`, account.name as string);
    })
  );
  return (type: ReferrerType, id: string) => names.get(`${type}:${id}`) ?? "Removido";
}

/** Ranking de quem mais indica e histórico completo, para a tela do admin. */
export async function getReferralOverview(): Promise<{ ranking: RankingRow[]; history: AdminReferralEntry[] }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("referrals")
    .select("id, referrer_type, referrer_id, status, reward_status, reward_note, created_at, businesses!referred_business_id(name)")
    .order("created_at", { ascending: false })
    .returns<AdminReferralRow[]>();
  if (error) throw error;
  const rows = data ?? [];
  const nameOf = await referrerNames(supabase, rows);

  const ranking = new Map<string, RankingRow>();
  for (const row of rows) {
    const key = `${row.referrer_type}:${row.referrer_id}`;
    const entry =
      ranking.get(key) ??
      { type: row.referrer_type, id: row.referrer_id, name: nameOf(row.referrer_type, row.referrer_id), registered: 0, converted: 0, pendingRewards: 0 };
    entry.registered += 1;
    if (row.status === "convertida") entry.converted += 1;
    if (row.reward_status === "pendente") entry.pendingRewards += 1;
    ranking.set(key, entry);
  }

  return {
    ranking: [...ranking.values()].sort((a, b) => b.converted - a.converted || b.registered - a.registered),
    history: rows.map((row) => ({ ...toEntry(row), referrerName: nameOf(row.referrer_type, row.referrer_id) })),
  };
}
