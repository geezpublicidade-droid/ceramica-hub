"use client";

import { useMemo, useState } from "react";
import { TaskRow } from "@/components/admin/TaskRow";
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL, type Task, type TaskStatus, type TaskPriority } from "@/lib/services/tasks";
import type { AssignableAdmin } from "@/lib/services/admins";

const ENTITY_LABEL: Record<string, string> = { lead: "Lead", business: "Empresa", contact: "Contato" };

function entityLabel(task: Task): string | undefined {
  if (!task.entityType) return undefined;
  return `${ENTITY_LABEL[task.entityType] ?? task.entityType} vinculado${task.entityId ? ` (${task.entityId.slice(0, 8)})` : ""}`;
}

export function TaskList({ tasks, admins }: { tasks: Task[]; admins: AssignableAdmin[] }) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "todas">("todas");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "todas">("todas");
  const [ownerFilter, setOwnerFilter] = useState<string>("todos");

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        if (statusFilter !== "todas" && task.status !== statusFilter) return false;
        if (priorityFilter !== "todas" && task.priority !== priorityFilter) return false;
        if (ownerFilter === "sem_responsavel" && task.ownerAdminId) return false;
        if (ownerFilter !== "todos" && ownerFilter !== "sem_responsavel" && task.ownerAdminId !== ownerFilter) return false;
        return true;
      }),
    [tasks, statusFilter, priorityFilter, ownerFilter]
  );

  const selectClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "todas")}>
          <option value="todas">Todos os status</option>
          {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className={selectClass} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "todas")}>
          <option value="todas">Todas as prioridades</option>
          {Object.entries(TASK_PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className={selectClass} value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
          <option value="todos">Todos os responsáveis</option>
          <option value="sem_responsavel">Sem responsável</option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.email}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[14px] text-muted">{filtered.length} de {tasks.length} tarefas</p>

      {filtered.length === 0 && <p className="text-[15px] text-muted">Nenhuma tarefa encontrada com esses filtros.</p>}
      {filtered.map((task) => (
        <TaskRow key={task.id} task={task} entityLabel={entityLabel(task)} />
      ))}
    </div>
  );
}
