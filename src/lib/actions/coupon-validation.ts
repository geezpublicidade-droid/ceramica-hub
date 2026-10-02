"use server";

import { revalidatePath } from "next/cache";
import { requireOwnBusiness } from "@/lib/auth-guards";
import { validateClaim, type ValidateResult } from "@/lib/services/coupon-claims";

/** A empresa (dono ou equipe) confirma um cupom apresentado pelo membro. */
export async function validateCouponAction(token: string): Promise<ValidateResult> {
  let businessId: string;
  try {
    businessId = await requireOwnBusiness();
  } catch {
    return { success: false, error: "Entre na conta da empresa para validar cupons." };
  }
  try {
    const result = await validateClaim(businessId, token);
    if (result.success) revalidatePath("/dashboard/cupons");
    return result;
  } catch (error) {
    console.error("[coupons] falha ao validar cupom:", error);
    return { success: false, error: "Não foi possível validar agora. Tente de novo." };
  }
}
