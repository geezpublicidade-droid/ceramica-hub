"use server";

import { getMemberId } from "@/lib/auth-guards";
import { logMetricEvent } from "@/lib/services/platform";
import { claimCoupon, type ClaimResult } from "@/lib/services/coupon-claims";

/** Revela o cupom: grava o resgate (com token do QR Code) e devolve o código. O log de métrica é "melhor
 * esforço" e nunca trava a experiência do membro. */
export async function claimCouponAction(benefitId: string): Promise<ClaimResult> {
  const memberId = await getMemberId();
  if (!memberId) return { success: false, error: "Entre na sua conta para revelar o cupom." };

  let result: ClaimResult;
  try {
    result = await claimCoupon(memberId, benefitId);
  } catch (error) {
    console.error("[coupons] falha ao revelar cupom:", error);
    return { success: false, error: "Não foi possível revelar o cupom. Tente de novo." };
  }

  if (result.success) {
    logMetricEvent("coupon_redeemed", result.businessId, { benefitId, memberId }).catch((error) =>
      console.error("[coupons] falha ao registrar métrica:", error)
    );
  }
  return result;
}
