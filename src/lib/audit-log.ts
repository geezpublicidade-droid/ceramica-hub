import { createServiceClient } from "@/lib/supabase/server";

export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}
