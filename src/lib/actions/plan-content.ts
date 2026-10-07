"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOwnBusiness } from "@/lib/auth-guards";
import { gateLimit, getContentUsage, planErrorFromDatabase } from "@/lib/services/company-plan";
import { logSystemAction } from "@/lib/audit-log";

type Result = { success: true } | { success: false; error: string };

const schema = z.object({
  kind: z.enum(["service", "photo", "video", "promotion"]),
  id: z.string().uuid(),
  active: z.boolean(),
});

const TABLE = { service: "business_services", photo: "business_photos", video: "business_photos", promotion: "benefits" } as const;
const FEATURE = { service: "services", photo: "gallery_images", video: "featured_videos", promotion: "active_promotions" } as const;
const USAGE_KEY = { service: "services", photo: "gallery_images", video: "featured_videos", promotion: "active_promotions" } as const;
const NOUN = { service: "serviços", photo: "fotos na galeria", video: "vídeos em destaque", promotion: "promoções ativas" } as const;

/**
 * Depois de um downgrade a empresa pode ter mais conteúdo do que o plano publica. Aqui ela ESCOLHE o que fica no ar:
 * desativar é sempre permitido; ativar só enquanto houver vaga no plano (a mesma regra vale no banco por trigger).
 * Nada é apagado: o conteúdo desativado continua salvo e pode voltar quando o plano permitir.
 */
export async function setContentActive(raw: z.input<typeof schema>): Promise<Result> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Pedido inválido." };
  const { kind, id, active } = parsed.data;
  const businessId = await requireOwnBusiness();
  const supabase = createServiceClient();

  const table = TABLE[kind];
  const { data: item } = await supabase.from(table).select("id, active").eq("id", id).eq("business_id", businessId).maybeSingle();
  if (!item) return { success: false, error: "Item não encontrado." };

  if (active && item.active !== true) {
    const usage = await getContentUsage(businessId);
    const gate = await gateLimit(businessId, FEATURE[kind], usage[USAGE_KEY[kind]] ?? 0, NOUN[kind]);
    if (!gate.ok) return { success: false, error: gate.error };
  }

  const { error } = await supabase.from(table).update({ active }).eq("id", id).eq("business_id", businessId);
  if (error) return { success: false, error: planErrorFromDatabase(error.message) ?? "Não foi possível atualizar." };

  await logSystemAction("plan_content_visibility", "business", businessId, { kind, id, active });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/[locale]/empresa/[slug]", "page");
  return { success: true };
}
