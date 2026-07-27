"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/services/turnstile";

const submitPartnerLeadSchema = z.object({
  businessName: z.string().trim().min(1, "Informe o nome da empresa."),
  contactName: z.string().trim().min(1, "Informe seu nome."),
  email: z.string().trim().min(1, "Informe o e-mail.").email("Informe um e-mail válido."),
  phone: z.string(),
  message: z.string(),
  turnstileToken: z.string().nullable().optional(),
});

export type SubmitPartnerLeadInput = z.input<typeof submitPartnerLeadSchema>;
export type SubmitPartnerLeadResult = { success: true } | { success: false; error: string };

/** Lead comercial pra equipe da Geez conversar sobre o plano Parceiro
 * Estratégico — não publica nada sozinho, só registra o contato pra
 * acompanhamento manual (ver getAllLeadsForAdmin / /admin/leads). */
export async function submitPartnerLead(rawInput: SubmitPartnerLeadInput): Promise<SubmitPartnerLeadResult> {
  const parsed = submitPartnerLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const input = parsed.data;

  const turnstileOk = await verifyTurnstileToken(input.turnstileToken);
  if (!turnstileOk) {
    return { success: false, error: "Não foi possível confirmar que você não é um robô. Tente novamente." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("partner_leads").insert({
    business_name: input.businessName.trim(),
    contact_name: input.contactName.trim(),
    email: input.email.toLowerCase(),
    phone: input.phone.trim() || null,
    message: input.message.trim() || null,
  });
  if (error) return { success: false, error: "Não foi possível enviar seu contato. Tente novamente." };

  return { success: true };
}
