import { createServiceClient } from "@/lib/supabase/server";
import { getProfileCompletenessMap } from "@/lib/services/admin-dashboard";

export type PublicImpactReport = {
  economia: { empresasAtivas: number; empresasFundadoras: number; contatosGerados: number };
  emprego: { oportunidadesPublicadas: number; vagasContratando: number };
  fluxo: { rotasSolicitadas: number; interesseEmEventos: number };
  visibilidade: { buscasRealizadas: number; visualizacoesDePagina: number };
  confianca: { perfisCompletos: number; enderecosVerificados: number };
};

async function count(query: PromiseLike<{ count: number | null }>): Promise<number> {
  return (await query).count ?? 0;
}

/** Indicadores públicos do Cerâmica Hub — só números que já são logados de
 * verdade (ver logMetricEvent em platform.ts). Nunca inventar/estimar: sem
 * evento registrado, o indicador aparece como 0. */
export async function getPublicImpactReport(): Promise<PublicImpactReport> {
  const supabase = createServiceClient();
  const metrics = (eventType: string) =>
    supabase.from("metrics_events").select("id", { count: "exact", head: true }).eq("event_type", eventType);

  const [
    empresasAtivas,
    empresasFundadoras,
    contatosGerados,
    oportunidadesPublicadas,
    vagasContratando,
    rotasSolicitadas,
    interesseEmEventos,
    buscasRealizadas,
    visualizacoesDePagina,
    enderecosVerificados,
    completeness,
  ] = await Promise.all([
    count(supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved")),
    count(supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("founder", true)),
    count(supabase.from("metrics_events").select("id", { count: "exact", head: true }).in("event_type", ["whatsapp_clicked", "appointment_clicked"])),
    count(supabase.from("opportunities").select("id", { count: "exact", head: true })),
    count(supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("type", "contratando")),
    count(metrics("directions_clicked")),
    count(metrics("event_interest_clicked")),
    count(metrics("search_performed")),
    count(metrics("commercial_page_viewed")),
    count(supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("address_verified", true)),
    getProfileCompletenessMap(),
  ]);

  const perfisCompletos = Array.from(completeness.values()).filter((missing) => missing.length === 0).length;

  return {
    economia: { empresasAtivas, empresasFundadoras, contatosGerados },
    emprego: { oportunidadesPublicadas, vagasContratando },
    fluxo: { rotasSolicitadas, interesseEmEventos },
    visibilidade: { buscasRealizadas, visualizacoesDePagina },
    confianca: { perfisCompletos, enderecosVerificados },
  };
}
