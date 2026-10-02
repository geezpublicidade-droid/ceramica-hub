import { createServiceClient } from "@/lib/supabase/server";
import type { AutomationKey } from "./registry";
import type { AutomationJob } from "./types";

export type Body = { subject: string; html: string };

export async function adminEmails(roles: string[]): Promise<string[]> {
  const { data, error } = await createServiceClient().from("admins").select("email").in("role", roles);
  if (error) throw error;
  return (data ?? []).map((row) => row.email);
}

/** Um job por admin destinatário, todos com o mesmo conteúdo. */
export function adminJobs(automation: AutomationKey, dedupeKey: string, recipients: string[], body: Body): AutomationJob[] {
  return recipients.map((to) => ({ automation, dedupeKey, to, build: async () => body }));
}
