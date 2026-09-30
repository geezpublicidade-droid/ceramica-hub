"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  addContentComment,
  createContentItem,
  deleteContentItem,
  setContentStatus,
  updateContentItem,
  CONTENT_STATUS_ORDER,
  type ContentItemInput,
  type ContentStatus,
} from "@/lib/services/content-calendar";

type ActionResult = { success: true; id?: string } | { success: false; error: string };

const CALENDAR_PATH = "/admin/marketing/calendario";
const MARKETING_ROLES: AdminRole[] = ["super_admin", "admin", "marketing", "conteudo"];
// Aprovar/agendar/publicar é uma decisão de gestão, não de quem produz.
const APPROVER_ROLES: AdminRole[] = ["super_admin", "admin", "marketing"];
const APPROVAL_STATUSES: ContentStatus[] = ["aprovado", "agendado", "publicado"];

function validate(input: ContentItemInput): string | null {
  if (!input.title.trim()) return "Título é obrigatório.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.scheduledFor)) return "Data inválida.";
  return null;
}

export async function createContentItemAction(input: ContentItemInput): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  const id = await createContentItem(input, adminId);
  await logAdminAction(adminId, "create_content_item", "content_item", id, { title: input.title, kind: input.kind });
  revalidatePath(CALENDAR_PATH);
  return { success: true, id };
}

export async function updateContentItemAction(id: string, input: ContentItemInput): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  await updateContentItem(id, input, adminId);
  await logAdminAction(adminId, "update_content_item", "content_item", id, { title: input.title });
  revalidatePath(CALENDAR_PATH);
  revalidatePath(`${CALENDAR_PATH}/${id}`);
  return { success: true };
}

export async function setContentStatusAction(id: string, status: ContentStatus): Promise<ActionResult> {
  if (!CONTENT_STATUS_ORDER.includes(status)) return { success: false, error: "Status inválido." };
  const adminId = await requireAdmin(APPROVAL_STATUSES.includes(status) ? APPROVER_ROLES : MARKETING_ROLES);

  await setContentStatus(id, status, adminId);
  await logAdminAction(adminId, "set_content_status", "content_item", id, { status });
  revalidatePath(CALENDAR_PATH);
  revalidatePath(`${CALENDAR_PATH}/${id}`);
  return { success: true };
}

export async function addContentCommentAction(id: string, body: string): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  if (!body.trim()) return { success: false, error: "Comentário vazio." };

  await addContentComment(id, adminId, body);
  revalidatePath(`${CALENDAR_PATH}/${id}`);
  return { success: true };
}

export async function deleteContentItemAction(id: string): Promise<ActionResult> {
  const adminId = await requireAdmin(APPROVER_ROLES);
  await deleteContentItem(id);
  await logAdminAction(adminId, "delete_content_item", "content_item", id, {});
  revalidatePath(CALENDAR_PATH);
  return { success: true };
}
