"use server";

import { getMemberId } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";

export async function getFavoriteStatus(businessId: string): Promise<boolean> {
  const memberId = await getMemberId();
  if (!memberId) return false;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("member_favorites")
    .select("id")
    .eq("member_id", memberId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * `currentlyFavorited` vem do estado que o botão já carregava na tela (o
 * mount dele já chamou getFavoriteStatus) — evita reconsultar o banco só
 * pra decidir entre insert e delete. `ignoreDuplicates` cobre o caso de
 * estado desatualizado (ex: duas abas abertas) sem estourar a constraint
 * única de (member_id, business_id).
 */
export async function toggleFavoriteAction(
  businessId: string,
  currentlyFavorited: boolean
): Promise<{ favorited: boolean } | { loggedOut: true }> {
  const memberId = await getMemberId();
  if (!memberId) return { loggedOut: true };

  const supabase = createServiceClient();

  if (currentlyFavorited) {
    await supabase.from("member_favorites").delete().eq("member_id", memberId).eq("business_id", businessId);
    return { favorited: false };
  }

  await supabase
    .from("member_favorites")
    .upsert({ member_id: memberId, business_id: businessId }, { onConflict: "member_id,business_id", ignoreDuplicates: true });
  return { favorited: true };
}
