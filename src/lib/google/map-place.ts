import type { OpeningSchedule, DayKey } from "../landing/hours.ts";
import type { ProfileDraft } from "../profile/draft.ts";

/** Subconjunto da resposta do Places API (New) que o importador usa. */
export type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  editorialSummary?: { text?: string };
  regularOpeningHours?: {
    periods?: { open?: GoogleTimePoint; close?: GoogleTimePoint }[];
    weekdayDescriptions?: string[];
  };
  accessibilityOptions?: Record<string, boolean | undefined>;
  parkingOptions?: Record<string, boolean | undefined>;
};
type GoogleTimePoint = { day?: number; hour?: number; minute?: number };

/** Google numera 0 = domingo. */
const GOOGLE_DAYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (point: GoogleTimePoint) => `${pad(point.hour ?? 0)}:${pad(point.minute ?? 0)}`;

/** Converte os períodos do Google. Aberto 24h vira 00:00–23:59; fechamento no dia seguinte é cortado em 23:59. */
export function scheduleFromGoogle(periods: NonNullable<GooglePlace["regularOpeningHours"]>["periods"]): OpeningSchedule | null {
  if (!periods?.length) return null;
  const schedule: OpeningSchedule = {};
  for (const period of periods) {
    const { open, close } = period;
    if (open?.day === undefined || open.day < 0 || open.day > 6) continue;
    const day = GOOGLE_DAYS[open.day];
    const from = clock(open);
    // sem "close" = aberto 24h; fechando em outro dia, vai até o fim deste
    const to = !close || close.day !== open.day ? "23:59" : clock(close);
    if (from >= to) continue;
    (schedule[day] ??= []).push([from, to]);
  }
  for (const ranges of Object.values(schedule)) ranges.sort((a, b) => a[0].localeCompare(b[0]));
  return Object.keys(schedule).length ? schedule : null;
}

/** Tipos do Google → uma das categorias do cadastro. Vazio quando nenhuma combina (a empresa escolhe). */
const CATEGORY_BY_TYPE: [string, string[]][] = [
  ["Saúde & Estética", ["dentist", "doctor", "hospital", "physiotherapist", "pharmacy", "health", "spa", "beauty_salon", "skin_care", "massage", "medical", "psychologist", "nutritionist", "veterinary"]],
  ["Moda & Beleza", ["hair_care", "hair_salon", "barber_shop", "clothing_store", "shoe_store", "jewelry_store", "nail_salon", "makeup", "cosmetics"]],
  ["Alimentação", ["restaurant", "cafe", "bakery", "bar", "meal_takeaway", "meal_delivery", "food", "ice_cream_shop", "pizza_restaurant", "confectionery", "coffee_shop"]],
  ["Contabilidade & Jurídico", ["accounting", "tax_consultant"]],
  ["Direito", ["lawyer", "law_firm", "notary"]],
  ["Educação", ["school", "university", "tutoring", "language_school", "training", "driving_school"]],
  ["Design & Arquitetura", ["architect", "interior_designer", "design_studio", "graphic_designer", "construction"]],
  ["Tecnologia & Marketing", ["marketing_agency", "advertising_agency", "software_company", "internet_cafe", "it_service", "web_designer"]],
  ["Investimentos", ["financial_planner", "investment", "insurance_agency", "bank", "finance"]],
  ["Laboratório", ["medical_lab", "laboratory"]],
];

export function categoryFromGoogleTypes(types: string[] = []): string {
  for (const [category, keys] of CATEGORY_BY_TYPE) {
    if (types.some((type) => keys.some((key) => type === key || type.includes(key)))) return category;
  }
  return "";
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Telefone brasileiro nacional para DDD+número; internacional (+55...) perde o 55. */
export function whatsappFromGoogle(national?: string, international?: string): string {
  const intl = digits(international ?? "");
  if (intl.startsWith("55") && intl.length >= 12) return intl.slice(2);
  const nat = digits(national ?? "");
  return nat.length >= 10 ? nat : "";
}

function instagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return match ? `@${match[1]}` : "";
}

function accessibilityText(options: GooglePlace["accessibilityOptions"]): string {
  if (!options) return "";
  const parts: string[] = [];
  if (options.wheelchairAccessibleEntrance) parts.push("entrada acessível para cadeirantes");
  if (options.wheelchairAccessibleParking) parts.push("vaga de estacionamento acessível");
  if (options.wheelchairAccessibleRestroom) parts.push("banheiro acessível");
  if (options.wheelchairAccessibleSeating) parts.push("assentos acessíveis");
  return parts.length ? `${parts[0].charAt(0).toUpperCase()}${parts.join(", ").slice(1)}.` : "";
}

function parkingText(options: GooglePlace["parkingOptions"]): string {
  if (!options) return "";
  const labels: [string, string][] = [
    ["freeParkingLot", "estacionamento gratuito"],
    ["paidParkingLot", "estacionamento pago"],
    ["freeGarageParking", "garagem gratuita"],
    ["paidGarageParking", "garagem paga"],
    ["freeStreetParking", "vaga gratuita na rua"],
    ["paidStreetParking", "vaga paga na rua"],
    ["valetParking", "manobrista"],
  ];
  const found = labels.filter(([key]) => options[key]).map(([, label]) => label);
  return found.length ? `${found[0].charAt(0).toUpperCase()}${found.join(", ").slice(1)}.` : "";
}

/**
 * Do lugar do Google para o que o wizard preenche. Só entra o que o Google devolveu;
 * nunca copia avaliações nem fotos de terceiros (os termos do Places não permitem guardar).
 */
export function draftFromGooglePlace(place: GooglePlace): Partial<ProfileDraft> {
  const website = place.websiteUri ?? "";
  const isInstagramSite = /instagram\.com/i.test(website);
  const hours = place.regularOpeningHours;
  return {
    name: place.displayName?.text ?? "",
    category: categoryFromGoogleTypes([place.primaryType ?? "", ...(place.types ?? [])].filter(Boolean)),
    shortDescription: place.editorialSummary?.text ?? "",
    whatsapp: whatsappFromGoogle(place.nationalPhoneNumber, place.internationalPhoneNumber),
    websiteUrl: isInstagramSite ? "" : website,
    instagram: isInstagramSite ? instagramHandle(website) : "",
    schedule: scheduleFromGoogle(hours?.periods),
    openingHoursText: hours?.weekdayDescriptions?.join(" · ") ?? "",
    accessibilityInfo: accessibilityText(place.accessibilityOptions),
    parkingInfo: parkingText(place.parkingOptions),
    googlePlaceId: place.id ?? "",
    googleMapsUrl: place.googleMapsUri ?? "",
  };
}
