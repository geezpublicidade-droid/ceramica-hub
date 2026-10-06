"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/services/turnstile";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";
import { logMetricEvent } from "@/lib/services/platform";
import { landingCapabilitiesFor } from "@/lib/landing/sections";

const LEAD_CONSENT_VERSION = "1.0";

const schema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 13;
    }, "Informe um telefone com DDD."),
  email: z.string().trim().max(200).email("Informe um e-mail válido.").optional().or(z.literal("")),
  serviceId: z.string().uuid().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
  consent: z.boolean().refine((value) => value, "É preciso concordar para enviar."),
  source: z.string().trim().max(60).optional(),
  pagePath: z.string().trim().max(200).optional(),
  turnstileToken: z.string().optional().nullable(),
});

export type SubmitBusinessLeadInput = z.input<typeof schema>;
export type SubmitBusinessLeadResult = { success: true } | { success: false; error: string };

function deviceFrom(userAgent: string | null): "mobile" | "desktop" {
  return /Mobi|Android|iPhone|iPad/i.test(userAgent ?? "") ? "mobile" : "desktop";
}

/**
 * Lead do formulário da landing da empresa: valida, confere que a empresa existe/está aprovada e tem o
 * formulário ativo no plano, grava vinculado a ela (status "novo") com consentimento LGPD e origem.
 */
export async function submitBusinessLead(rawInput: SubmitBusinessLeadInput): Promise<SubmitBusinessLeadResult> {
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const input = parsed.data;

  if (!(await withinRateLimit(RATE_LIMITS.businessLead))) {
    return { success: false, error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }
  if (!(await verifyTurnstileToken(input.turnstileToken))) {
    return { success: false, error: "Não foi possível confirmar que você não é um robô. Tente novamente." };
  }

  const supabase = createServiceClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, plan, trial_status, trial_plan, trial_ends_at, business_landing(lead_form_enabled)")
    .eq("id", input.businessId)
    .maybeSingle();
  if (!business || business.status !== "approved") return { success: false, error: "Empresa não encontrada." };

  const trialActive = business.trial_status === "active" && business.trial_plan && business.trial_ends_at && new Date(business.trial_ends_at) > new Date();
  const plan = (trialActive ? business.trial_plan : business.plan) as Parameters<typeof landingCapabilitiesFor>[0];
  const landing = Array.isArray(business.business_landing) ? business.business_landing[0] : business.business_landing;
  if (!landingCapabilitiesFor(plan).leadForm || !landing?.lead_form_enabled) {
    return { success: false, error: "Esta empresa não está recebendo pedidos pelo formulário." };
  }

  let serviceName: string | null = null;
  if (input.serviceId) {
    const { data: service } = await supabase.from("business_services").select("name").eq("id", input.serviceId).eq("business_id", input.businessId).maybeSingle();
    serviceName = service?.name ?? null;
  }

  const userAgent = (await headers()).get("user-agent");
  const { error } = await supabase.from("business_leads").insert({
    business_id: input.businessId,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    service_id: serviceName ? input.serviceId : null,
    service_name: serviceName,
    message: input.message || null,
    consent_version: LEAD_CONSENT_VERSION,
    source: input.source || "direto",
    page_path: input.pagePath ?? null,
    device: deviceFrom(userAgent),
  });
  if (error) {
    console.error("[business-leads] falha ao gravar lead:", error.message);
    return { success: false, error: "Não foi possível enviar agora. Tente de novo em instantes." };
  }

  try {
    await logMetricEvent("lead_submitted", input.businessId, { service: serviceName, source: input.source || "direto" });
  } catch {
    // métrica nunca pode derrubar o envio do lead
  }
  return { success: true };
}
