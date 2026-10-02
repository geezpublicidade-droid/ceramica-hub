import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { AutomationRow } from "@/components/admin/AutomationRow";
import { AUTOMATIONS, AUTOMATION_KEYS } from "@/lib/services/automations/registry";
import { getAutomationStats, getEnabledAutomations } from "@/lib/services/automations/engine";
import { OPERATIONAL_RULES, OPERATIONAL_RULE_META } from "@/lib/services/operations/catalog";
import { getOpenAutoTaskCounts } from "@/lib/services/operations/runner";

export const metadata = { title: "Automações — Cerâmica Hub" };

export default async function AutomationsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing"]);
  const [enabled, stats, openTasks] = await Promise.all([getEnabledAutomations(), getAutomationStats(), getOpenAutoTaskCounts()]);

  return (
    <AdminShell currentPath="/admin/marketing" adminRole={adminRole}>
      <div>
        <Link href="/admin/marketing" className="text-[14px] text-muted hover:text-foreground">
          ← Central de Marketing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Automações</h1>
        <p className="mt-2 text-[16px] text-muted">
          E-mails automáticos que rodam todo dia às 11h (horário de Brasília). Cada aviso sai uma única vez por fato, e quem se descadastrou nunca recebe.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {AUTOMATION_KEYS.map((key) => (
          <AutomationRow key={key} automationKey={key} meta={AUTOMATIONS[key]} enabled={enabled[key]} stats={stats[key]} />
        ))}
      </div>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Regras operacionais</h2>
        <p className="mt-1 text-[14px] text-muted">
          Rodam junto com os e-mails, todo dia. Criam tarefas em Tarefas ou ajustam o estado do sistema sozinhas.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {OPERATIONAL_RULES.map((rule) => (
            <div key={rule} className="rounded-2xl border border-border bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[16px] font-semibold text-foreground">{OPERATIONAL_RULE_META[rule].label}</p>
                <span className="text-[13px] text-muted">
                  {OPERATIONAL_RULE_META[rule].effect === "task" ? `${openTasks[rule]} tarefa(s) em aberto` : "Ajuste automático"}
                </span>
              </div>
              <p className="mt-1 text-[14px] text-muted">{OPERATIONAL_RULE_META[rule].description}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
