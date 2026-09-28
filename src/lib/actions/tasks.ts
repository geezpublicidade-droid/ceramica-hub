"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  createTask,
  updateTaskStatus,
  updateTaskOwner,
  deleteTask,
  type CreateTaskInput,
  type TaskStatus,
} from "@/lib/services/tasks";

type ActionResult = { success: true } | { success: false; error: string };

const TASKS_PATH = "/admin/tarefas";
const OWNER_ROLES: AdminRole[] = ["super_admin", "admin", "comercial", "atendimento", "marketing", "financeiro"];

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  if (!input.title.trim()) return { success: false, error: "Título é obrigatório." };

  const id = await createTask(input);
  await logAdminAction(adminId, "create_task", "task", id, { title: input.title, entityType: input.entityType ?? null });
  revalidatePath(TASKS_PATH);
  if (input.entityType === "business" && input.entityId) revalidatePath(`/admin/empresas/${input.entityId}`);
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  await updateTaskStatus(taskId, status);
  await logAdminAction(adminId, "update_task_status", "task", taskId, { status });
  revalidatePath(TASKS_PATH);
  return { success: true };
}

export async function updateTaskOwnerAction(taskId: string, ownerAdminId: string | null): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  await updateTaskOwner(taskId, ownerAdminId);
  await logAdminAction(adminId, "update_task_owner", "task", taskId, { ownerAdminId });
  revalidatePath(TASKS_PATH);
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  await deleteTask(taskId);
  await logAdminAction(adminId, "delete_task", "task", taskId, {});
  revalidatePath(TASKS_PATH);
  return { success: true };
}
