import { createServiceClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/auth";

export type AssignableAdmin = { id: string; email: string; role: AdminRole };

/** Lista curta de admins pra dropdown de "responsável" (leads/tarefas) --
 * qualquer admin pode ser dono de um lead/tarefa, independente do papel. */
export async function getAssignableAdmins(): Promise<AssignableAdmin[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("admins").select("id, email, role").order("email");
  if (error) throw error;
  return (data ?? []) as AssignableAdmin[];
}
