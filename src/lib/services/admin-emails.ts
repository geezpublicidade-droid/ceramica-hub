import { createServiceClient } from "@/lib/supabase/server";

/** E-mail dos admins por id, para mostrar quem fez cada ação. */
export async function getAdminEmailMap(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const { data, error } = await createServiceClient().from("admins").select("id, email").in("id", unique);
  if (error) throw error;
  return new Map((data ?? []).map((admin) => [admin.id, admin.email]));
}
