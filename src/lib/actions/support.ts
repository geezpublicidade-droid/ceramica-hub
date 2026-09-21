"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createTicket, addRequesterMessage, type RequesterIdentity } from "@/lib/services/support";

type ActionResult = { success: true } | { success: false; error: string };

/** Deriva sempre da sessão -- nunca de um campo vindo do cliente, mesmo
 * raciocínio de isolamento por tenant documentado em auth-guards.ts. */
async function currentRequester(): Promise<RequesterIdentity | null> {
  const session = await auth();
  if (session?.user?.businessId) return { type: "business", id: session.user.businessId };
  if (session?.user?.memberId) return { type: "member", id: session.user.memberId };
  return null;
}

const newTicketSchema = z.object({
  requesterName: z.string().trim().min(1, "Informe seu nome.").max(120),
  requesterContact: z.string().trim().min(1, "Informe um contato (e-mail ou WhatsApp).").max(120),
  subject: z.string().trim().min(1, "Informe o assunto.").max(150),
  message: z.string().trim().min(1, "Escreva sua mensagem.").max(4000),
});

export async function createTicketAction(rawInput: z.infer<typeof newTicketSchema>): Promise<ActionResult> {
  const requester = await currentRequester();
  if (!requester) return { success: false, error: "Não autenticado." };
  const parsed = newTicketSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await createTicket({ requester, ...parsed.data });
  revalidatePath(requester.type === "business" ? "/dashboard/suporte" : "/membro/suporte");
  return { success: true };
}

const replySchema = z.object({
  body: z.string().trim().min(1, "Escreva uma mensagem.").max(4000),
});

export async function addRequesterMessageAction(
  ticketId: string,
  rawInput: z.infer<typeof replySchema>
): Promise<ActionResult> {
  const requester = await currentRequester();
  if (!requester) return { success: false, error: "Não autenticado." };
  const parsed = replySchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const ok = await addRequesterMessage(ticketId, requester, parsed.data.body);
  if (!ok) return { success: false, error: "Chamado não encontrado." };
  revalidatePath(requester.type === "business" ? `/dashboard/suporte/${ticketId}` : `/membro/suporte/${ticketId}`);
  return { success: true };
}
