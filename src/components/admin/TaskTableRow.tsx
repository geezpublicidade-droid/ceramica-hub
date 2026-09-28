"use client";

import { useTransition } from "react";
import { updateTaskStatusAction, deleteTaskAction } from "@/lib/actions/tasks";
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL, type Task, type TaskStatus } from "@/lib/services/tasks";

const STATUSES = Object.keys(TASK_STATUS_LABEL) as TaskStatus[];

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  baixa: "bg-black/5 text-muted",
  media: "bg-primary/10 text-primary",
  alta: "bg-amber-100 text-amber-700",
  urgente: "bg-red-100 text-red-700",
};

/** Linha de tabela pra Tarefas (desktop) -- ao contrário de Contatos, aqui
 * não tem modo de edição expandido, então não precisa de linha colSpan: o
 * status já é editável direto na célula via <select>, igual ao TaskRow em
 * card (ainda usado no mobile). */
export function TaskTableRow({ task, entityLabel, zebra }: { task: Task; entityLabel?: string; zebra?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const isOverdue = task.dueAt && task.status === "pendente" && new Date(task.dueAt) < new Date();

  function handleDelete() {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    startTransition(() => void deleteTaskAction(task.id));
  }

  return (
    <tr className={`border-b border-border/60 last:border-0 ${zebra ? "bg-black/[0.015]" : ""}`}>
      <td className="px-3 py-2.5">
        <p className="font-medium text-foreground">{task.title}</p>
        {task.description && <p className="mt-0.5 max-w-xs text-[12px] text-muted">{task.description}</p>}
      </td>
      <td className="px-3 py-2.5 text-muted">{entityLabel ?? "—"}</td>
      <td className="px-3 py-2.5 text-muted">{task.ownerEmail ?? "sem responsável"}</td>
      <td className="px-3 py-2.5 text-muted">
        {task.dueAt ? new Date(task.dueAt).toLocaleString("pt-BR") : "—"}
        {isOverdue && (
          <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-red-700">Atrasada</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${PRIORITY_COLOR[task.priority]}`}>
          {TASK_PRIORITY_LABEL[task.priority]}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <select
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-[12px] text-foreground disabled:opacity-60"
          value={task.status}
          disabled={isPending}
          onChange={(e) => startTransition(() => void updateTaskStatusAction(task.id, e.target.value as TaskStatus))}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5 text-right">
        <button type="button" disabled={isPending} onClick={handleDelete} className="text-[12px] font-medium text-red-600 underline disabled:opacity-60">
          Excluir
        </button>
      </td>
    </tr>
  );
}
