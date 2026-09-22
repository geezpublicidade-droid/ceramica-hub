"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getMemberId } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/services/platform";
import { getMyReviewForBusiness, type BusinessReview } from "@/lib/services/reviews";

type SubmitResult = { success: true } | { success: false; error: string } | { loggedOut: true };

/** Pra o formulário saber, antes de qualquer envio, se esse membro já tem
 * avaliação pra essa empresa (e em qual status) -- pré-preenche em vez de
 * deixar reenviar sem perceber que já existe uma. */
export async function getMyReviewAction(businessId: string): Promise<BusinessReview | null | { loggedOut: true }> {
  const memberId = await getMemberId();
  if (!memberId) return { loggedOut: true };
  return getMyReviewForBusiness(businessId, memberId);
}

const reviewSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Escreva um pouco mais sobre sua experiência.").max(1000),
});

/**
 * Sempre volta pro status "pendente" ao (re)enviar -- inclusive numa edição
 * de avaliação já aprovada, porque o texto mudou e precisa ser conferido de
 * novo antes de continuar público.
 */
export async function submitReview(
  businessId: string,
  rating: number,
  comment: string
): Promise<SubmitResult> {
  const memberId = await getMemberId();
  if (!memberId) return { loggedOut: true };

  const parsed = reviewSchema.safeParse({ businessId, rating, comment });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("business_reviews").upsert(
    {
      business_id: parsed.data.businessId,
      member_id: memberId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      status: "pendente",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,member_id" }
  );
  if (error) return { success: false, error: "Não foi possível enviar sua avaliação." };

  revalidatePath(`/empresa/${business.slug}`);
  return { success: true };
}
