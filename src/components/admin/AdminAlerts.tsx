import Link from "next/link";
import type { AdminAlert } from "@/lib/services/admin-alerts";

const SEVERITY_STYLE: Record<AdminAlert["severity"], string> = {
  danger: "border-danger/30 bg-danger/5 text-danger",
  warning: "border-warning/30 bg-warning/5 text-warning",
  info: "border-border bg-white/70 text-muted",
};

/** Faixa de alertas acionáveis no topo do dashboard; some quando não há nenhum. */
export function AdminAlerts({ alerts }: { alerts: AdminAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <section aria-label="Alertas" className="mt-4 flex flex-col gap-2">
      {alerts.map((alert) => (
        <Link
          key={alert.key}
          href={alert.href}
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-[14px] font-medium transition-opacity hover:opacity-80 ${SEVERITY_STYLE[alert.severity]}`}
        >
          <span>{alert.message}</span>
          <span className="rounded-full bg-current/10 px-2.5 py-0.5 text-[13px] font-semibold">{alert.count}</span>
        </Link>
      ))}
    </section>
  );
}
