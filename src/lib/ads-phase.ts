export type CampaignPhase = "pending_review" | "scheduled" | "active" | "paused" | "completed" | "rejected";

export const PHASE_ORDER: CampaignPhase[] = ["pending_review", "scheduled", "active", "paused", "completed", "rejected"];

export const PHASE_LABEL: Record<CampaignPhase, string> = {
  pending_review: "Aguardando revisão",
  scheduled: "Agendada",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  rejected: "Recusada",
};

export const PHASE_CLASS: Record<CampaignPhase, string> = {
  pending_review: "bg-purple-100 text-purple-700",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-muted/20 text-muted",
  rejected: "bg-red-100 text-red-700",
};

/** Fase visual de uma campanha pro board -- deriva de status + janela de
 * datas (o banco só guarda status bruto: pending_review/approved/paused/
 * rejected; "agendada" vs "ativa" vs "concluída" são o mesmo status
 * "approved" em momentos diferentes do período). Função pura, sem import de
 * Supabase, pra poder ser usada tanto no server (resumo financeiro) quanto
 * num client component (agrupar colunas do board) sem puxar código
 * server-only pro bundle do cliente. */
export function campaignPhase(
  campaign: { status: string; startsAt: string; endsAt: string },
  today: string = new Date().toISOString().slice(0, 10)
): CampaignPhase {
  if (campaign.status === "pending_review") return "pending_review";
  if (campaign.status === "paused") return "paused";
  if (campaign.status === "rejected") return "rejected";
  if (campaign.status === "approved") {
    if (campaign.endsAt < today) return "completed";
    if (campaign.startsAt > today) return "scheduled";
    return "active";
  }
  return "completed";
}
