import { requireAdminPage } from "@/lib/auth-guards";
import { getAllTasksForAdmin } from "@/lib/services/tasks";
import { getAssignableAdmins } from "@/lib/services/admins";
import { NewTaskForm } from "@/components/admin/NewTaskForm";
import { TaskList } from "@/components/admin/TaskList";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Tarefas — Cerâmica Hub" };

export default async function AdminTasksPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial", "atendimento", "marketing", "financeiro"]);
  const [tasks, admins] = await Promise.all([getAllTasksForAdmin(), getAssignableAdmins()]);

  return (
    <AdminShell currentPath="/admin/tarefas" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tarefas</h1>
        <p className="mt-2 text-[16px] text-muted">
          Pendências do time — de acompanhamento de lead a cobrança de contrato. Pode ficar solta ou vinculada a um
          lead, empresa ou contato.
        </p>
      </div>

      <NewTaskForm admins={admins} />

      <TaskList tasks={tasks} admins={admins} />
    </AdminShell>
  );
}
