import type { AdminRole } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type AdminAlert = {
  key: string;
  severity: "danger" | "warning" | "info";
  message: string;
  count: number;
  href: string;
};

const PROPOSAL_EXPIRY_WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

type AlertBuilder = (now: Date) => Promise<AdminAlert | null>;

async function countOf(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function alertIfAny(count: number, alert: Omit<AdminAlert, "count">): AdminAlert | null {
  return count > 0 ? { ...alert, count } : null;
}

const pendingBusinesses: AlertBuilder = async () =>
  alertIfAny(
    await countOf(createServiceClient().from("businesses").select("id", { count: "exact", head: true }).eq("status", "pending")),
    { key: "pending-businesses", severity: "warning", message: "Cadastros de empresas aguardando aprovação", href: "/admin" },
  );

const overdueTasks: AlertBuilder = async (now) =>
  alertIfAny(
    await countOf(
      createServiceClient()
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["pendente", "em_andamento"])
        .lt("due_at", now.toISOString()),
    ),
    { key: "overdue-tasks", severity: "danger", message: "Tarefas atrasadas", href: "/admin/tarefas" },
  );

const overdueLeadActions: AlertBuilder = async (now) =>
  alertIfAny(
    await countOf(
      createServiceClient()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .not("stage", "in", "(fechado,perdido)")
        .lt("next_action_at", now.toISOString()),
    ),
    { key: "overdue-lead-actions", severity: "warning", message: "Leads com próxima ação vencida", href: "/admin/leads" },
  );

const expiringProposals: AlertBuilder = async (now) =>
  alertIfAny(
    await countOf(
      createServiceClient()
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .in("status", ["enviada", "visualizada", "negociacao"])
        .gte("valid_until", now.toISOString().slice(0, 10))
        .lte("valid_until", new Date(now.getTime() + PROPOSAL_EXPIRY_WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10)),
    ),
    {
      key: "expiring-proposals",
      severity: "warning",
      message: `Propostas vencendo em até ${PROPOSAL_EXPIRY_WINDOW_DAYS} dias`,
      href: "/admin/propostas",
    },
  );

const openTickets: AlertBuilder = async () =>
  alertIfAny(
    await countOf(createServiceClient().from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "aberto")),
    { key: "open-tickets", severity: "info", message: "Chamados de suporte abertos", href: "/admin/suporte" },
  );

const ALERTS: { build: AlertBuilder; roles: AdminRole[] }[] = [
  { build: pendingBusinesses, roles: ["admin", "moderador"] },
  { build: overdueTasks, roles: ["admin", "comercial", "atendimento", "marketing", "financeiro"] },
  { build: overdueLeadActions, roles: ["admin", "comercial"] },
  { build: expiringProposals, roles: ["admin", "comercial"] },
  { build: openTickets, roles: ["admin", "moderador", "financeiro", "comercial", "atendimento"] },
];

const SEVERITY_ORDER: Record<AdminAlert["severity"], number> = { danger: 0, warning: 1, info: 2 };

/** Alertas acionáveis do dashboard, só dos assuntos que o papel enxerga
 * (super_admin vê todos). Um alerta que falha ao carregar é omitido, com log,
 * em vez de quebrar o painel. */
export async function getAdminAlerts(role: AdminRole): Promise<AdminAlert[]> {
  const now = new Date();
  const applicable = ALERTS.filter((alert) => role === "super_admin" || alert.roles.includes(role));
  const settled = await Promise.allSettled(applicable.map((alert) => alert.build(now)));

  return settled
    .flatMap((result) => {
      if (result.status === "fulfilled") return result.value ? [result.value] : [];
      console.error("[admin-alerts] falha ao montar alerta:", result.reason);
      return [];
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
