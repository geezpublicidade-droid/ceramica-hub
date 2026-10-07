"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/services/turnstile";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";
import { sendEmail } from "@/lib/services/email";

const schema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").max(200),
  phone: z.string().trim().max(30).optional(),
  role: z.string().trim().max(80).optional(),
  message: z.string().trim().max(800).optional(),
  consent: z.boolean().refine((value) => value, "É preciso concordar para enviar."),
  turnstileToken: z.string().optional().nullable(),
});

export type SubmitProfileClaimInput = z.input<typeof schema>;
export type SubmitProfileClaimResult = { success: true } | { success: false; error: string };

/**
 * Pedido para reivindicar um perfil sem proprietário validado. Não muda nada no perfil: entra numa fila que o admin aprova
 * ou recusa (admin/reivindicacoes). Só aceita perfis aprovados que ainda não têm dono validado.
 */
export async function submitProfileClaim(rawInput: SubmitProfileClaimInput): Promise<SubmitProfileClaimResult> {
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const input = parsed.data;

  if (!(await withinRateLimit(RATE_LIMITS.profileClaim))) return { success: false, error: "Muitas tentativas. Aguarde um pouco e tente de novo." };
  if (!(await verifyTurnstileToken(input.turnstileToken))) return { success: false, error: "Não foi possível confirmar que você não é um robô. Tente novamente." };

  const supabase = createServiceClient();
  const { data: business } = await supabase.from("businesses").select("id, name, status, owner_validated").eq("id", input.businessId).maybeSingle();
  if (!business || business.status !== "approved") return { success: false, error: "Empresa não encontrada." };
  if (business.owner_validated) return { success: false, error: "Este perfil já tem um responsável validado." };

  const { count } = await supabase
    .from("profile_claims")
    .select("id", { count: "exact", head: true })
    .eq("business_id", input.businessId)
    .eq("claimant_email", input.email.toLowerCase())
    .eq("status", "pending");
  if ((count ?? 0) > 0) return { success: true };

  const { error } = await supabase.from("profile_claims").insert({
    business_id: input.businessId,
    claimant_name: input.name,
    claimant_email: input.email.toLowerCase(),
    claimant_phone: input.phone || null,
    role_in_company: input.role || null,
    message: input.message || null,
  });
  if (error) return { success: false, error: "Não foi possível enviar agora. Tente de novo em instantes." };

  const { data: admins } = await supabase.from("admins").select("email").in("role", ["super_admin", "admin", "comercial"]);
  for (const admin of admins ?? []) {
    if (admin.email) await sendEmail({ to: admin.email, subject: `Pedido para reivindicar perfil: ${business.name}`, html: `<p>${input.name} (${input.email}) pediu para reivindicar o perfil de <strong>${business.name}</strong>. Analise em /admin/reivindicacoes.</p>` });
  }
  return { success: true };
}
