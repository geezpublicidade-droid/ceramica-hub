"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import type { PartnerLeadStatus } from "@/lib/services/partner-leads";

type ActionResult = { success: true } | { success: false; error: string };

const STATUSES = ["novo", "em_contato", "convertido", "descartado"] as const;

export async function updateLeadStatus(leadId: string, status: PartnerLeadStatus): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "comercial"]);
  if (!STATUSES.includes(status)) return { success: false, error: "Status inválido." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("partner_leads").update({ status }).eq("id", leadId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_partner_lead_status", "partner_lead", leadId, { status });
  revalidatePath("/admin/leads");
  return { success: true };
}
