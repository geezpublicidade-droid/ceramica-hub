"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
}

export async function approveBusiness(businessId: string) {
  await requireAdmin();
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
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectBusiness(businessId: string, reason: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("businesses")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", businessId);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
}
