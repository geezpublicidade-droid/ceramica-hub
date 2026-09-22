"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import type { ReviewStatus } from "@/lib/services/reviews";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateReviewStatus(reviewId: string, status: ReviewStatus): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "moderador"]);
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("business_reviews")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_review_status", "business_review", reviewId, { status });
  revalidatePath("/admin/avaliacoes");
  return { success: true };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "moderador"]);
  const supabase = createServiceClient();

  const { error } = await supabase.from("business_reviews").delete().eq("id", reviewId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_review", "business_review", reviewId, {});
  revalidatePath("/admin/avaliacoes");
  return { success: true };
}
