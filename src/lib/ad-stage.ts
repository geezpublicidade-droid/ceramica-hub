/** Etiqueta de fase da campanha para a empresa (pura, usada no servidor e no navegador). */
export type CampaignStageInput = { status: string; paymentStatus: string; startsAt: string; endsAt: string };

export type StageTone = "green" | "blue" | "yellow" | "red" | "gray";

/** Fase da campanha para a empresa: junta status, pagamento e datas numa etiqueta só (verde no ar, azul agendada, amarelo aguardando, vermelho correção). */
export function campaignStage(
  c: CampaignStageInput,
  today: string,
): { label: string; tone: StageTone } {
  if (c.status === "rejected") return { label: "Precisa de correção", tone: "red" };
  if (c.status === "paused") return { label: "Pausada", tone: "gray" };
  if (c.paymentStatus === "pendente") return { label: "Aguardando pagamento", tone: "yellow" };
  if (c.status === "pending_review") return { label: "Em análise", tone: "yellow" };
  if (c.status === "approved") {
    if (c.endsAt < today) return { label: "Encerrada", tone: "gray" };
    return c.startsAt <= today ? { label: "No ar", tone: "green" } : { label: "Agendada", tone: "blue" };
  }
  return { label: "Encerrada", tone: "gray" };
}

export type PublicationStageInput = { status: string; paymentStatus: string; scheduledFor: string };

/** Fase da publicação reservada (Story, newsletter, matéria) para a empresa. */
export function publicationStage(p: PublicationStageInput): { label: string; tone: StageTone } {
  if (p.status === "cancelado") return { label: "Cancelada", tone: "gray" };
  if (p.status === "correcao") return { label: "Precisa de correção", tone: "red" };
  if (p.status === "publicado") return { label: "Publicado", tone: "green" };
  if (p.status === "aprovado") return { label: "Agendado", tone: "blue" };
  return { label: p.paymentStatus === "pendente" ? "Aguardando pagamento e aprovação" : "Aguardando aprovação", tone: "yellow" };
}
