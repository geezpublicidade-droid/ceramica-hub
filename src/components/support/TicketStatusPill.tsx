import { StatusPill } from "@/components/dashboard/StatusPill";
import type { SupportTicketStatus } from "@/lib/services/support";

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  aberto: "Aguardando resposta",
  respondido: "Respondido",
  fechado: "Fechado",
};

const STATUS_TONE: Record<SupportTicketStatus, "positive" | "pending" | "neutral"> = {
  aberto: "pending",
  respondido: "positive",
  fechado: "neutral",
};

export function TicketStatusPill({ status }: { status: SupportTicketStatus }) {
  return <StatusPill label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />;
}
