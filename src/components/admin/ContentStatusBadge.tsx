import { StatusBadge } from "@/components/admin/StatusBadge";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@/lib/services/content-calendar";

export const CONTENT_STATUS_STYLE: Record<ContentStatus, string> = {
  ideia: "bg-black/5 text-muted",
  planejamento: "bg-sky-100 text-sky-800",
  em_producao: "bg-indigo-100 text-indigo-800",
  aguardando_aprovacao: "bg-warning/15 text-warning",
  aprovado: "bg-success/15 text-success",
  agendado: "bg-primary-soft text-primary",
  publicado: "bg-success text-white",
  cancelado: "bg-danger/10 text-danger",
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <StatusBadge label={CONTENT_STATUS_LABEL[status]} className={CONTENT_STATUS_STYLE[status]} />;
}
