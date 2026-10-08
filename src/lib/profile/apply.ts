import type { createServiceClient } from "@/lib/supabase/server";
import { MAX_DRAFT_FAQS, MAX_DRAFT_PHOTOS, MAX_DRAFT_SERVICES, type ProfileDraft } from "./draft";

type Supabase = ReturnType<typeof createServiceClient>;

const httpsOrNull = (value: string): string | null => (/^https:\/\/[^\s]{1,480}$/i.test(value.trim()) ? value.trim() : null);
const orNull = (value: string): string | null => value.trim() || null;

/** "R$ 1.200,50" / "120" → número; vazio ou ilegível → null. */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Grava o que o wizard coletou além dos campos básicos da empresa. O plano limita serviços, fotos e FAQ no
 * banco (triggers); aqui cada bloco é tentado separado e o que o plano recusa NÃO derruba o cadastro:
 * fica guardado inteiro em `business_profile_imports` para ser aplicado quando o plano permitir.
 * Devolve os blocos que o plano barrou.
 */
export async function applyProfileDraft(supabase: Supabase, businessId: string, draft: ProfileDraft, source: "wizard" | "google"): Promise<string[]> {
  const skipped: string[] = [];

  await supabase.from("business_profile_imports").upsert({
    business_id: businessId,
    source,
    google_place_id: orNull(draft.googlePlaceId),
    google_maps_url: httpsOrNull(draft.googleMapsUrl),
    payload: draft,
    updated_at: new Date().toISOString(),
  });

  const landing = {
    business_id: businessId,
    // a empresa ainda está em análise: nada disso aparece antes da aprovação, e o rascunho evita surpresa depois
    status: "draft" as const,
    whatsapp_phone: orNull(draft.whatsapp.replace(/\D/g, "")),
    opening_schedule: draft.schedule,
    facebook_url: httpsOrNull(draft.facebookUrl),
    tiktok_url: httpsOrNull(draft.tiktokUrl),
    youtube_url: httpsOrNull(draft.youtubeUrl),
    parking_info: orNull(draft.parkingInfo),
    accessibility_info: orNull(draft.accessibilityInfo),
    about_differentials: draft.differentials.map((d) => d.trim()).filter(Boolean).slice(0, 8),
    years_in_business: draft.yearsInBusiness,
    by_appointment: draft.byAppointment,
  };
  const { error: landingError } = await supabase.from("business_landing").upsert(landing, { onConflict: "business_id" });
  if (landingError) skipped.push("landing");

  const services = draft.services.filter((s) => s.name.trim()).slice(0, MAX_DRAFT_SERVICES);
  if (services.length) {
    const rows = services.map((s, index) => ({
      business_id: businessId,
      name: s.name.trim().slice(0, 120),
      description: orNull(s.description)?.slice(0, 400) ?? null,
      starting_price: parsePrice(s.price),
      sort_order: index,
    }));
    // um por vez: o trigger do plano barra a partir do limite, e os primeiros devem entrar
    for (const row of rows) {
      const { error } = await supabase.from("business_services").insert(row);
      if (error) {
        skipped.push("services");
        break;
      }
    }
  }

  const faqs = draft.faqs.filter((f) => f.question.trim() && f.answer.trim()).slice(0, MAX_DRAFT_FAQS);
  if (faqs.length) {
    const { error } = await supabase.from("business_faqs").insert(
      faqs.map((f, index) => ({ business_id: businessId, question: f.question.trim().slice(0, 160), answer: f.answer.trim().slice(0, 800), sort_order: index })),
    );
    if (error) skipped.push("faqs");
  }

  const photos = draft.photos.map(httpsOrNull).filter((url): url is string => url !== null).slice(0, MAX_DRAFT_PHOTOS);
  for (const [index, url] of photos.entries()) {
    const { error } = await supabase.from("business_photos").insert({ business_id: businessId, url, sort_order: index });
    if (error) {
      skipped.push("photos");
      break;
    }
  }

  return skipped;
}
