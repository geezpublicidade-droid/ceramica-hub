"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { addAdminMessage, updateTicketStatus, type SupportTicketStatus } from "@/lib/services/support";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };
const STATUSES = ["aberto", "respondido", "fechado"] as const;

/** Nome genérico em vez do e-mail do admin que respondeu -- quem recebe é
 * empresário ou membro, não precisa saber qual conta interna atendeu. */
const SUPPORT_TEAM_NAME = "Equipe Cerâmica Hub";

const replySchema = z.object({
  body: z.string().trim().min(1, "Escreva uma mensagem.").max(4000),
});

export async function replyToTicketAction(ticketId: string, rawInput: z.infer<typeof replySchema>): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const parsed = replySchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await addAdminMessage(ticketId, SUPPORT_TEAM_NAME, parsed.data.body);
  await logAdminAction(adminId, "reply_support_ticket", "support_ticket", ticketId, {});
  revalidatePath("/admin/suporte");
  revalidatePath(`/admin/suporte/${ticketId}`);
  return { success: true };
}

export async function updateTicketStatusAction(ticketId: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const adminId = await requireAdmin();
  if (!STATUSES.includes(status as SupportTicketStatus)) return { success: false, error: "Status inválido." };

  await updateTicketStatus(ticketId, status);
  await logAdminAction(adminId, "update_support_ticket_status", "support_ticket", ticketId, { status });
  revalidatePath("/admin/suporte");
  revalidatePath(`/admin/suporte/${ticketId}`);
  return { success: true };
}
