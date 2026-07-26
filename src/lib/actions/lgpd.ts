"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { requireOwnBusiness, requireBusinessOwner } from "@/lib/auth-guards";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Portabilidade de dados (LGPD): junta tudo que a própria empresa cadastrou
 * e devolve como JSON, pra download imediato — não precisa de fila/admin,
 * só fica registrado em audit_logs pra efeito de comprovação.
 */
export async function requestDataExport(): Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }> {
  const businessId = await requireOwnBusiness();
  const supabase = createServiceClient();

  const [business, services, photos, benefits, opportunities, virtualTourScenes, consents, invoices] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", businessId).single(),
    supabase.from("business_services").select("*").eq("business_id", businessId),
    supabase.from("business_photos").select("*").eq("business_id", businessId),
    supabase.from("benefits").select("*").eq("business_id", businessId),
    supabase.from("opportunities").select("*").eq("business_id", businessId),
    supabase.from("virtual_tour_scenes").select("*").eq("business_id", businessId),
    supabase.from("consent_acceptances").select("*").eq("business_id", businessId),
    supabase.from("invoices").select("*").eq("business_id", businessId),
  ]);

  if (business.error) return { success: false, error: "Não foi possível reunir seus dados." };

  // password_hash nunca sai no export -- é interno, não é dado que a empresa "forneceu" pra portar.
  const { password_hash, mfa_secret, ...businessData } = business.data as Record<string, unknown>;
  void password_hash;
  void mfa_secret;

  await supabase.from("audit_logs").insert({
    actor_type: "business",
    actor_id: businessId,
    action: "data_export_requested",
    entity_type: "business",
    entity_id: businessId,
  });

  return {
    success: true,
    data: {
      exportedAt: new Date().toISOString(),
      business: businessData,
      services: services.data ?? [],
      photos: photos.data ?? [],
      benefits: benefits.data ?? [],
      opportunities: opportunities.data ?? [],
      virtualTourScenes: virtualTourScenes.data ?? [],
      consentAcceptances: consents.data ?? [],
      invoices: invoices.data ?? [],
    },
  };
}

/**
 * Direito ao esquecimento (LGPD): a exclusão em si NÃO é imediata -- vira um
 * pedido pendente pro admin revisar (pode ter fatura pendente, assinatura
 * ativa etc.), ver src/lib/actions/admin-lgpd.ts.
 */
export async function requestDataDeletion(reason: string): Promise<ActionResult> {
  const businessId = await requireBusinessOwner();
  const supabase = createServiceClient();

  const { data: business } = await supabase.from("businesses").select("name").eq("id", businessId).single();
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const { data: existing } = await supabase
    .from("data_deletion_requests")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { success: false, error: "Você já tem uma solicitação de exclusão pendente." };

  const { error } = await supabase.from("data_deletion_requests").insert({
    business_id: businessId,
    business_name: business.name,
    reason: reason.trim() || null,
  });
  if (error) return { success: false, error: "Não foi possível registrar a solicitação." };

  await supabase.from("audit_logs").insert({
    actor_type: "business",
    actor_id: businessId,
    action: "data_deletion_requested",
    entity_type: "business",
    entity_id: businessId,
    metadata: { reason: reason.trim() || null },
  });

  return { success: true };
}
