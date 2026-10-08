"use server";

import { getPlace, searchPlaces, type PlaceSummary } from "@/lib/google/places";
import { draftFromGooglePlace } from "@/lib/google/map-place";
import type { ProfileDraft } from "@/lib/profile/draft";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";

type SearchResult = { success: true; simulated: boolean; results: PlaceSummary[] } | { success: false; error: string };
type ImportResult = { success: true; simulated: boolean; draft: Partial<ProfileDraft> } | { success: false; error: string };

const BUSY = "Muitas buscas seguidas. Aguarde alguns minutos.";
const UNAVAILABLE = "Não foi possível consultar o Google agora. Você pode preencher manualmente.";

/** Busca empresas no Google pelo nome (e cidade, se a pessoa digitar). Público: o cadastro acontece antes do login. */
export async function searchGoogleBusiness(query: string): Promise<SearchResult> {
  const text = query.trim().slice(0, 120);
  if (text.length < 3) return { success: false, error: "Digite pelo menos 3 letras do nome da empresa." };
  if (!(await withinRateLimit(RATE_LIMITS.googleImport))) return { success: false, error: BUSY };
  try {
    return { success: true, ...(await searchPlaces(text)) };
  } catch (error) {
    console.error("[google-import] busca falhou:", error);
    return { success: false, error: UNAVAILABLE };
  }
}

/** Traz os dados do lugar escolhido, já no formato do wizard. */
export async function importGoogleBusiness(placeId: string): Promise<ImportResult> {
  if (!/^[\w-]{3,200}$/.test(placeId)) return { success: false, error: "Empresa inválida." };
  if (!(await withinRateLimit(RATE_LIMITS.googleImport))) return { success: false, error: BUSY };
  try {
    const { simulated, place } = await getPlace(placeId);
    if (!place) return { success: false, error: "Não encontramos essa empresa no Google." };
    return { success: true, simulated, draft: draftFromGooglePlace(place) };
  } catch (error) {
    console.error("[google-import] detalhes falharam:", error);
    return { success: false, error: UNAVAILABLE };
  }
}
