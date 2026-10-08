import type { GooglePlace } from "./map-place";

export type PlaceSummary = { id: string; name: string; address: string };

const API = "https://places.googleapis.com/v1";
const DETAIL_FIELDS = [
  "id", "displayName", "formattedAddress", "nationalPhoneNumber", "internationalPhoneNumber", "websiteUri", "googleMapsUri",
  "primaryType", "types", "editorialSummary", "regularOpeningHours", "accessibilityOptions", "parkingOptions",
].join(",");

/** Sem chave configurada o importador roda em modo simulado (dados de exemplo), para o fluxo ser testável. */
export const placesConfigured = () => Boolean(process.env.GOOGLE_PLACES_API_KEY);

async function placesFetch<T>(path: string, init: { method: "GET" | "POST"; fieldMask: string; body?: unknown }): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
      "X-Goog-FieldMask": init.fieldMask,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Places API ${response.status}`);
  return (await response.json()) as T;
}

const SIMULATED: GooglePlace[] = [
  {
    id: "simulado-1",
    displayName: { text: "Clínica Sorriso Exemplo" },
    formattedAddress: "Av. Exemplo, 100 - Cerâmica, São Caetano do Sul - SP",
    nationalPhoneNumber: "(11) 4000-1234",
    internationalPhoneNumber: "+55 11 4000-1234",
    websiteUri: "https://www.exemplo.com.br",
    googleMapsUri: "https://maps.google.com/?cid=0",
    primaryType: "dentist",
    types: ["dentist", "health"],
    editorialSummary: { text: "Clínica odontológica com atendimento humanizado e tecnologia de ponta." },
    regularOpeningHours: {
      periods: [1, 2, 3, 4, 5].map((day) => ({ open: { day, hour: 8, minute: 0 }, close: { day, hour: 18, minute: 0 } })),
      weekdayDescriptions: ["segunda: 08:00–18:00", "terça: 08:00–18:00"],
    },
    accessibilityOptions: { wheelchairAccessibleEntrance: true },
  },
];

export async function searchPlaces(query: string): Promise<{ simulated: boolean; results: PlaceSummary[] }> {
  if (!placesConfigured()) {
    return { simulated: true, results: SIMULATED.map((p) => ({ id: p.id ?? "", name: p.displayName?.text ?? "", address: p.formattedAddress ?? "" })) };
  }
  const data = await placesFetch<{ places?: GooglePlace[] }>("/places:searchText", {
    method: "POST",
    fieldMask: "places.id,places.displayName,places.formattedAddress",
    body: { textQuery: query, languageCode: "pt-BR", regionCode: "BR", maxResultCount: 5 },
  });
  return {
    simulated: false,
    results: (data.places ?? []).flatMap((p) => (p.id ? [{ id: p.id, name: p.displayName?.text ?? "", address: p.formattedAddress ?? "" }] : [])),
  };
}

export async function getPlace(id: string): Promise<{ simulated: boolean; place: GooglePlace | null }> {
  if (!placesConfigured()) return { simulated: true, place: SIMULATED.find((p) => p.id === id) ?? null };
  const place = await placesFetch<GooglePlace>(`/places/${encodeURIComponent(id)}?languageCode=pt-BR`, { method: "GET", fieldMask: DETAIL_FIELDS });
  return { simulated: false, place };
}
