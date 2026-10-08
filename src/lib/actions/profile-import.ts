"use server";

import { revalidatePath } from "next/cache";
import { saveBranding, saveLandingConfig } from "@/lib/actions/landing-editor";
import { importGoogleBusiness } from "@/lib/actions/google-import";
import { resolveLandingTarget } from "@/lib/landing/guard";
import { createServiceClient } from "@/lib/supabase/server";
import type { ProfileDraft } from "@/lib/profile/draft";
import { IMPORT_FIELD_KEYS, type ImportFieldKey } from "@/lib/profile/import-fields";

type Result = { success: true; applied: string[] } | { success: false; error: string };

/**
 * Aplica no perfil da empresa os campos do Google que ela marcou. Reaproveita as ações do editor
 * (validação, limites de plano e auditoria já estão lá); cada grupo é salvo separado e o primeiro erro é devolvido.
 */
export async function applyGoogleImport(adminBusinessId: string | undefined, placeId: string, fields: ImportFieldKey[]): Promise<Result> {
  const chosen = fields.filter((field) => IMPORT_FIELD_KEYS.includes(field));
  if (!chosen.length) return { success: false, error: "Marque pelo menos um campo." };

  // Os valores são buscados de novo no servidor: nunca se confia no que o navegador diz que o Google devolveu.
  const imported = await importGoogleBusiness(placeId);
  if (!imported.success) return imported;
  const draft = imported.draft;
  const pick = <K extends ImportFieldKey>(key: K): ProfileDraft[K] | undefined => (chosen.includes(key) ? (draft[key] as ProfileDraft[K]) : undefined);

  const branding = {
    description: pick("shortDescription"),
    instagram: pick("instagram"),
    websiteUrl: pick("websiteUrl"),
  };
  const landing = {
    whatsappPhone: pick("whatsapp"),
    openingSchedule: pick("schedule"),
    parkingInfo: pick("parkingInfo"),
    accessibilityInfo: pick("accessibilityInfo"),
  };

  const defined = (obj: Record<string, unknown>) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
  const brandingPatch = defined(branding);
  const landingPatch = defined(landing);

  if (Object.keys(brandingPatch).length) {
    const result = await saveBranding(adminBusinessId, brandingPatch);
    if (!result.success) return result;
  }
  if (Object.keys(landingPatch).length) {
    const result = await saveLandingConfig(adminBusinessId, landingPatch);
    if (!result.success) return result;
  }

  try {
    const target = await resolveLandingTarget(adminBusinessId);
    await createServiceClient().from("business_profile_imports").upsert({
      business_id: target.businessId,
      source: "google",
      google_place_id: draft.googlePlaceId || null,
      google_maps_url: draft.googleMapsUrl || null,
      payload: draft,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // o registro do vínculo é complementar; o perfil já foi atualizado
  }
  revalidatePath("/dashboard/importar");
  return { success: true, applied: chosen };
}
