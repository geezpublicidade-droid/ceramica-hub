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
  const { error } = await supabase
    .from("businesses")
    .update({ status: "approved", rejection_reason: null })
    .eq("id", businessId);
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
