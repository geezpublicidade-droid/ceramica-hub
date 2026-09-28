"use client";

import { useMemo, useState } from "react";
import { TaskRow } from "@/components/admin/TaskRow";
import { TaskTableRow } from "@/components/admin/TaskTableRow";
import { SortableTh } from "@/components/admin/SortableTh";
import { useSortableData } from "@/lib/hooks/useSortableData";
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL, type Task, type TaskStatus, type TaskPriority } from "@/lib/services/tasks";
import type { AssignableAdmin } from "@/lib/services/admins";

const ENTITY_LABEL: Record<string, string> = { lead: "Lead", business: "Empresa", contact: "Contato" };

function entityLabel(task: Task): string | undefined {
  if (!task.entityType) return undefined;
  return `${ENTITY_LABEL[task.entityType] ?? task.entityType} vinculado${task.entityId ? ` (${task.entityId.slice(0, 8)})` : ""}`;
}

const PRIORITY_RANK: Record<TaskPriority, number> = { baixa: 0, media: 1, alta: 2, urgente: 3 };

type SortKey = "title" | "owner" | "due" | "priority" | "status";

const COMPARE: Record<SortKey, (a: Task, b: Task) => number> = {
  title: (a, b) => a.title.localeCompare(b.title, "pt-BR"),
  owner: (a, b) => (a.ownerEmail ?? "").localeCompare(b.ownerEmail ?? "", "pt-BR"),
  due: (a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  status: (a, b) => TASK_STATUS_LABEL[a.status].localeCompare(TASK_STATUS_LABEL[b.status], "pt-BR"),
};

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

  const { sorted, sortKey, direction, toggleSort } = useSortableData(filtered, COMPARE);

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

      <p className="text-[14px] text-muted">{sorted.length} de {tasks.length} tarefas</p>

      {sorted.length === 0 && <p className="text-[15px] text-muted">Nenhuma tarefa encontrada com esses filtros.</p>}

      {sorted.length > 0 && (
        <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white/60 md:block">
          <table className="w-full border-collapse text-[13px]">
            <thead className="border-b border-border">
              <tr>
                <SortableTh label="Tarefa" sortKey="title" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">Vínculo</th>
                <SortableTh label="Responsável" sortKey="owner" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <SortableTh label="Prazo" sortKey="due" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <SortableTh label="Prioridade" sortKey="priority" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((task, i) => (
                <TaskTableRow key={task.id} task={task} entityLabel={entityLabel(task)} zebra={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 md:hidden">
        {sorted.map((task) => (
          <TaskRow key={task.id} task={task} entityLabel={entityLabel(task)} />
        ))}
      </div>
    </div>
  );
}
