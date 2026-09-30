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

export function TaskRow({ task, entityLabel }: { task: Task; entityLabel?: string }) {
  const [isPending, startTransition] = useTransition();

  const isOverdue = task.dueAt && task.status === "pendente" && new Date(task.dueAt) < new Date();

  function handleDelete() {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    startTransition(() => void deleteTaskAction(task.id));
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 px-4 py-3">
      <div>
        <p className="text-[15px] font-medium text-foreground">
          {task.title}{" "}
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${PRIORITY_COLOR[task.priority]}`}>
            {TASK_PRIORITY_LABEL[task.priority]}
          </span>
          {isOverdue && (
            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-red-700">
              Atrasada
            </span>
          )}
        </p>
        <p className="text-[13px] text-muted">
          {[
            entityLabel,
            task.ownerEmail ? `responsável: ${task.ownerEmail}` : "sem responsável",
            task.dueAt ? `prazo: ${new Date(task.dueAt).toLocaleString("pt-BR")}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {task.description && <p className="mt-1 max-w-md text-[13px] text-muted">{task.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
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
        <button type="button" disabled={isPending} onClick={handleDelete} className="text-[12px] font-medium text-red-600 underline disabled:opacity-60">
          Excluir
        </button>
      </div>
    </div>
  );
}
