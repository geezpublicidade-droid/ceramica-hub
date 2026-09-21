"use server";

import { getMemberId } from "@/lib/auth-guards";
import { logMetricEvent } from "@/lib/services/platform";

/** Log "melhor esforço" -- resgate já revelou o código no cliente antes
 * desta chamada voltar (ver CouponCard.tsx), então um erro aqui nunca deve
 * travar a experiência do membro. Sem memberId, simplesmente não loga (não
 * é um caminho que precise de erro pro usuário). */
export async function logCouponRevealedAction(benefitId: string, businessId: string): Promise<void> {
  const memberId = await getMemberId();
  if (!memberId) return;
  await logMetricEvent("coupon_redeemed", businessId, { benefitId, memberId });
}
