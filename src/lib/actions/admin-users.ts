"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import type { AdminRole } from "@/auth";

type ActionResult = { success: true } | { success: false; error: string };

const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "financeiro", "comercial", "moderador"];

const createAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Senha precisa ter no mínimo 8 caracteres."),
  role: z.enum(ADMIN_ROLES as [AdminRole, ...AdminRole[]]),
});

async function countSuperAdmins(supabase: ReturnType<typeof createServiceClient>): Promise<number> {
  const { count } = await supabase
    .from("admins")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  return count ?? 0;
}

export async function createAdmin(rawInput: z.infer<typeof createAdminSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin"]);
  const parsed = createAdminSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("admins")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) return { success: false, error: "Já existe um admin com esse e-mail." };

  const password_hash = await bcrypt.hash(parsed.data.password, 12);
  const { data: created, error } = await supabase
    .from("admins")
    .insert({ email: parsed.data.email, password_hash, role: parsed.data.role })
    .select("id")
    .single();
  if (error || !created) return { success: false, error: "Não foi possível criar o admin." };

  await logAdminAction(adminId, "create_admin", "admin", created.id, { email: parsed.data.email, role: parsed.data.role });
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function updateAdminRole(targetAdminId: string, role: AdminRole): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin"]);
  const supabase = createServiceClient();

  const { data: target } = await supabase.from("admins").select("role").eq("id", targetAdminId).maybeSingle();
  if (!target) return { success: false, error: "Admin não encontrado." };

  // Sem isso dá pra rebaixar o último super_admin e ninguém mais consegue
  // gerenciar admins (nem o próprio painel de usuários fica acessível).
  if (target.role === "super_admin" && role !== "super_admin" && (await countSuperAdmins(supabase)) <= 1) {
    return { success: false, error: "Precisa existir pelo menos um super_admin." };
  }

  const { error } = await supabase.from("admins").update({ role }).eq("id", targetAdminId);
  if (error) return { success: false, error: "Não foi possível atualizar o papel." };

  await logAdminAction(adminId, "update_admin_role", "admin", targetAdminId, { role });
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function removeAdmin(targetAdminId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin"]);
  if (targetAdminId === adminId) return { success: false, error: "Você não pode remover sua própria conta." };

  const supabase = createServiceClient();
  const { data: target } = await supabase.from("admins").select("role").eq("id", targetAdminId).maybeSingle();
  if (!target) return { success: false, error: "Admin não encontrado." };

  if (target.role === "super_admin" && (await countSuperAdmins(supabase)) <= 1) {
    return { success: false, error: "Precisa existir pelo menos um super_admin." };
  }

  const { error } = await supabase.from("admins").delete().eq("id", targetAdminId);
  if (error) return { success: false, error: "Não foi possível remover o admin." };

  await logAdminAction(adminId, "remove_admin", "admin", targetAdminId, {});
  revalidatePath("/admin/usuarios");
  return { success: true };
}
