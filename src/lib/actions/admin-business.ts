"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
  return session.user.id;
}

async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createServiceClient();
  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}

export async function approveBusiness(businessId: string) {
  const adminId = await requireAdmin();
  const supabase = createServiceClient();

  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (fetchError) throw fetchError;

  const update: Record<string, unknown> = { status: "approved", rejection_reason: null };

  // trial de 14 dias do plano Destaque, só pra quem entra pelo gratuito
  if (business.plan === "presenca") {
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("trial_enabled, trial_plan, trial_duration_days")
      .single();

    if (settings?.trial_enabled) {
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + settings.trial_duration_days * 24 * 60 * 60 * 1000);
      update.trial_status = "active";
      update.trial_plan = settings.trial_plan;
      update.trial_started_at = startedAt.toISOString();
      update.trial_ends_at = endsAt.toISOString();
    }
  }

  const { error } = await supabase.from("businesses").update(update).eq("id", businessId);
  if (error) throw error;

  await logAdminAction(adminId, "approve_business", "business", businessId, {
    trialGranted: Boolean(update.trial_status),
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectBusiness(businessId: string, reason: string) {
  const adminId = await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("businesses")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", businessId);
  if (error) throw error;

  await logAdminAction(adminId, "reject_business", "business", businessId, { reason: reason || null });

  revalidatePath("/admin");
  revalidatePath("/");
}
