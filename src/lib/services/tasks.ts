import { createServiceClient } from "@/lib/supabase/server";

export type TaskPriority = "baixa" | "media" | "alta" | "urgente";
export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "cancelada";

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** Tarefas genéricas do admin -- podem se vincular a qualquer entidade
 * (lead, empresa, contato, campanha) via entity_type/entity_id livre, mesmo
 * padrão de audit_logs. Ver supabase/migrations/0051_tasks.sql. */
export type Task = {
  id: string;
  title: string;
  description: string | null;
  ownerAdminId: string | null;
  ownerEmail: string | null;
  priority: TaskPriority;
  dueAt: string | null;
  status: TaskStatus;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  owner_admin_id: string | null;
  priority: TaskPriority;
  due_at: string | null;
  status: TaskStatus;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
  admins: { email: string } | null;
};

const TASK_SELECT =
  "id, title, description, owner_admin_id, priority, due_at, status, entity_type, entity_id, created_at, updated_at, admins(email)";

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ownerAdminId: row.owner_admin_id,
    ownerEmail: row.admins?.email ?? null,
    priority: row.priority,
    dueAt: row.due_at,
    status: row.status,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllTasksForAdmin(): Promise<Task[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as unknown as TaskRow[]).map(mapTask);
}

export async function getTasksByEntity(entityType: string, entityId: string): Promise<Task[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as TaskRow[]).map(mapTask);
}

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  ownerAdminId?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};

export async function createTask(input: CreateTaskInput): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description ?? null,
      owner_admin_id: input.ownerAdminId ?? null,
      priority: input.priority ?? "media",
      due_at: input.dueAt ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar tarefa.");
  return data.id as string;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateTaskOwner(id: string, ownerAdminId: string | null): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("tasks").update({ owner_admin_id: ownerAdminId }).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
