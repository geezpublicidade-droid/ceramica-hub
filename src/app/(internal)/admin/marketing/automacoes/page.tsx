import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { AutomationRow } from "@/components/admin/AutomationRow";
import { AUTOMATIONS, AUTOMATION_KEYS } from "@/lib/services/automations/registry";
import { getAutomationStats, getEnabledAutomations } from "@/lib/services/automations/engine";

export const metadata = { title: "Automações — Cerâmica Hub" };

export default async function AutomationsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing"]);
  const [enabled, stats] = await Promise.all([getEnabledAutomations(), getAutomationStats()]);

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
    </AdminShell>
  );
}
