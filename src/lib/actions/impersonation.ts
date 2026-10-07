"use server";

import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { createServiceClient } from "@/lib/supabase/server";

// O payload do update não está nos tipos de sessão; applyImpersonation (src/auth.ts) valida o super_admin pelo token.
const switchTo = (businessId: string | null) => unstable_update({ impersonate: businessId } as never);

/** Super_admin entra no painel de qualquer empresa. Fica registrado na auditoria (início e fim). */
export async function startImpersonationAction(businessId: string): Promise<void> {
  const adminId = await requireAdmin(["super_admin"]);
  const { data } = await createServiceClient().from("businesses").select("id").eq("id", businessId).maybeSingle();
  if (!data) throw new Error("Empresa não encontrada.");
  await logAdminAction(adminId, "impersonate_start", "business", businessId);
  await switchTo(businessId);
  redirect("/dashboard");
}

/** Volta do painel da empresa para a sessão de admin. */
export async function stopImpersonationAction(): Promise<void> {
  const session = await auth();
  const adminId = session?.user.impersonatedBy;
  if (!adminId) redirect("/admin");
  const businessId = session.user.businessId ?? null;
  await logAdminAction(adminId, "impersonate_stop", "business", businessId);
  await switchTo(null);
  redirect(businessId ? `/admin/empresas/${businessId}` : "/admin");
}
