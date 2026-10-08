import { parseSchedule, type OpeningSchedule } from "../landing/hours.ts";

/** Tudo que o wizard coleta (digitado ou importado). Não inclui conta, torre nem aceites: isso é do cadastro. */
export type ProfileDraft = {
  name: string;
  category: string;
  shortDescription: string;
  whatsapp: string;
  document: string;
  openingHoursText: string;
  schedule: OpeningSchedule | null;
  websiteUrl: string;
  instagram: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  logoUrl: string;
  coverPhotoUrl: string;
  photos: string[];
  services: DraftService[];
  faqs: DraftFaq[];
  differentials: string[];
  yearsInBusiness: number | null;
  byAppointment: boolean;
  parkingInfo: string;
  accessibilityInfo: string;
  googlePlaceId: string;
  googleMapsUrl: string;
};

export type DraftService = { name: string; description: string; price: string };
export type DraftFaq = { question: string; answer: string };

export const MAX_DRAFT_SERVICES = 12;
export const MAX_DRAFT_FAQS = 12;
export const MAX_DRAFT_PHOTOS = 12;

export const emptyDraft: ProfileDraft = {
  name: "",
  category: "",
  shortDescription: "",
  whatsapp: "",
  document: "",
  openingHoursText: "",
  schedule: null,
  websiteUrl: "",
  instagram: "",
  facebookUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  logoUrl: "",
  coverPhotoUrl: "",
  photos: [],
  services: [],
  faqs: [],
  differentials: [],
  yearsInBusiness: null,
  byAppointment: false,
  parkingInfo: "",
  accessibilityInfo: "",
  googlePlaceId: "",
  googleMapsUrl: "",
};

const isFilled = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value;
  return value !== null && value !== undefined;
};

/** Campos do rascunho que o importador preencheu (para o wizard avisar "veio do Google, confira"). */
export function filledFields(partial: Partial<ProfileDraft>): (keyof ProfileDraft)[] {
  return (Object.keys(partial) as (keyof ProfileDraft)[]).filter((key) => isFilled(partial[key]));
}

/**
 * Junta uma importação ao que a empresa já digitou. Por padrão o que ela digitou vence:
 * a importação só preenche o que está vazio. Com `overwrite`, a importação vence nos campos que trouxe.
 */
export function mergeImport(current: ProfileDraft, imported: Partial<ProfileDraft>, overwrite = false): ProfileDraft {
  const next: ProfileDraft = { ...current };
  for (const key of filledFields(imported)) {
    if (overwrite || !isFilled(current[key])) (next as Record<string, unknown>)[key] = imported[key];
  }
  return next;
}

export type CompletenessItem = { key: string; label: string; done: boolean; weight: number };

/** Itens do "perfil completo": o que pesa mais para a empresa aparecer bem. */
export function completenessItems(draft: ProfileDraft): CompletenessItem[] {
  return [
    { key: "description", label: "Descrição da empresa", done: draft.shortDescription.trim().length >= 40, weight: 15 },
    { key: "logo", label: "Logo", done: isFilled(draft.logoUrl), weight: 10 },
    { key: "cover", label: "Foto de capa", done: isFilled(draft.coverPhotoUrl), weight: 10 },
    { key: "hours", label: "Horário de funcionamento", done: draft.schedule !== null || isFilled(draft.openingHoursText), weight: 10 },
    { key: "contact", label: "WhatsApp", done: isFilled(draft.whatsapp), weight: 10 },
    { key: "social", label: "Instagram ou site", done: isFilled(draft.instagram) || isFilled(draft.websiteUrl), weight: 5 },
    { key: "services", label: "Serviços ou produtos", done: draft.services.length >= 3, weight: 15 },
    { key: "photos", label: "Fotos da galeria", done: draft.photos.length >= 3, weight: 10 },
    { key: "faqs", label: "Perguntas frequentes", done: draft.faqs.length >= 2, weight: 10 },
    { key: "differentials", label: "Diferenciais", done: draft.differentials.length >= 1, weight: 5 },
  ];
}

/** 0–100. */
export function completenessScore(draft: ProfileDraft): number {
  const items = completenessItems(draft);
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  return Math.round((items.filter((item) => item.done).reduce((sum, item) => sum + item.weight, 0) / total) * 100);
}

/** Lê o payload salvo no banco sem confiar no formato: campo estranho vira o valor vazio. */
export function draftFromPayload(raw: unknown): ProfileDraft {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const str = (key: keyof ProfileDraft) => (typeof source[key] === "string" ? (source[key] as string) : "");
  const list = <T>(key: keyof ProfileDraft, pick: (item: Record<string, unknown>) => T | null): T[] =>
    Array.isArray(source[key])
      ? (source[key] as unknown[]).flatMap((item) => {
          const value = item && typeof item === "object" ? pick(item as Record<string, unknown>) : null;
          return value ? [value] : [];
        })
      : [];
  const text = (item: Record<string, unknown>, key: string) => (typeof item[key] === "string" ? (item[key] as string) : "");

  return {
    ...emptyDraft,
    name: str("name"),
    category: str("category"),
    shortDescription: str("shortDescription"),
    whatsapp: str("whatsapp"),
    document: str("document"),
    openingHoursText: str("openingHoursText"),
    schedule: parseSchedule(source.schedule),
    websiteUrl: str("websiteUrl"),
    instagram: str("instagram"),
    facebookUrl: str("facebookUrl"),
    tiktokUrl: str("tiktokUrl"),
    youtubeUrl: str("youtubeUrl"),
    logoUrl: str("logoUrl"),
    coverPhotoUrl: str("coverPhotoUrl"),
    photos: Array.isArray(source.photos) ? (source.photos as unknown[]).filter((u): u is string => typeof u === "string") : [],
    services: list("services", (i) => (text(i, "name") ? { name: text(i, "name"), description: text(i, "description"), price: text(i, "price") } : null)),
    faqs: list("faqs", (i) => (text(i, "question") && text(i, "answer") ? { question: text(i, "question"), answer: text(i, "answer") } : null)),
    differentials: Array.isArray(source.differentials) ? (source.differentials as unknown[]).filter((d): d is string => typeof d === "string") : [],
    yearsInBusiness: typeof source.yearsInBusiness === "number" ? source.yearsInBusiness : null,
    byAppointment: source.byAppointment === true,
    parkingInfo: str("parkingInfo"),
    accessibilityInfo: str("accessibilityInfo"),
    googlePlaceId: str("googlePlaceId"),
    googleMapsUrl: str("googleMapsUrl"),
  };
}
