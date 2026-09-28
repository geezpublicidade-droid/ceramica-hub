"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  createContact,
  updateContact,
  deleteContact,
  type CreateContactInput,
  type UpdateContactInput,
} from "@/lib/services/contacts";

type ActionResult = { success: true } | { success: false; error: string };

const CONTACTS_PATH = "/admin/contatos";
const OWNER_ROLES: AdminRole[] = ["super_admin", "admin", "comercial", "atendimento"];

export async function createContactAction(input: CreateContactInput): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  if (!input.name.trim()) return { success: false, error: "Nome do contato é obrigatório." };
  if (!input.businessId) return { success: false, error: "Selecione a empresa." };

  const id = await createContact(input);
  await logAdminAction(adminId, "create_contact", "contact", id, { businessId: input.businessId, name: input.name });
  revalidatePath(CONTACTS_PATH);
  revalidatePath(`/admin/empresas/${input.businessId}`);
  return { success: true };
}

export async function updateContactAction(
  id: string,
  businessId: string,
  input: UpdateContactInput
): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  await updateContact(id, input);
  await logAdminAction(adminId, "update_contact", "contact", id, input as Record<string, unknown>);
  revalidatePath(CONTACTS_PATH);
  revalidatePath(`/admin/empresas/${businessId}`);
  return { success: true };
}

export async function deleteContactAction(id: string, businessId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  await deleteContact(id);
  await logAdminAction(adminId, "delete_contact", "contact", id, { businessId });
  revalidatePath(CONTACTS_PATH);
  revalidatePath(`/admin/empresas/${businessId}`);
  return { success: true };
}
