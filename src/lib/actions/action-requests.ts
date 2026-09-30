"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createTicket } from "@/lib/services/support";
import { getBusinessById } from "@/lib/services/platform";
import { ACTION_REQUEST_TYPES, ACTION_REQUEST_LABEL } from "@/lib/action-requests";

type ActionResult = { success: true } | { success: false; error: string };

const requestSchema = z.object({
  type: z.enum(ACTION_REQUEST_TYPES),
  message: z.string().trim().max(2000).optional(),
});

/** "Solicitar ação" do portal de resultados: vira um chamado de suporte
 * rotulado, pra equipe tratar na mesma fila de /admin/suporte. A empresa
 * vem sempre da sessão, nunca de um campo do cliente. */
export async function requestActionAction(rawInput: z.infer<typeof requestSchema>): Promise<ActionResult> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return { success: false, error: "Não autenticado." };

  const parsed = requestSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: "Escolha o tipo de ação." };

  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const label = ACTION_REQUEST_LABEL[parsed.data.type];
  await createTicket({
    requester: { type: "business", id: businessId },
    requesterName: business.name,
    requesterContact: session?.user?.email ?? business.phone,
    subject: `Solicitação de ação: ${label}`,
    message: parsed.data.message || `A empresa solicitou: ${label}.`,
  });
  revalidatePath("/dashboard/suporte");
  return { success: true };
}
