import type { ProfileDraft } from "./draft.ts";

/** Campos do Google que a empresa pode escolher aplicar no perfil já existente. */
export const IMPORT_FIELDS = [
  { key: "shortDescription", label: "Descrição" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "schedule", label: "Horário de funcionamento" },
  { key: "websiteUrl", label: "Site" },
  { key: "instagram", label: "Instagram" },
  { key: "parkingInfo", label: "Estacionamento" },
  { key: "accessibilityInfo", label: "Acessibilidade" },
] as const satisfies readonly { key: keyof ProfileDraft; label: string }[];

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

export const IMPORT_FIELD_KEYS: readonly ImportFieldKey[] = IMPORT_FIELDS.map((field) => field.key);

/** Valores atuais da empresa nos mesmos campos, para comparar com o que veio do Google. */
export type CurrentProfileValues = Pick<ProfileDraft, ImportFieldKey>;

/** Separa o que o Google trouxe em: novo (campo vazio), diferente (já preenchido) e igual (nada a fazer). */
export function compareImport(current: CurrentProfileValues, imported: Partial<ProfileDraft>) {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const empty = (v: unknown) => v === null || v === undefined || v === "";
  return IMPORT_FIELDS.flatMap(({ key, label }) => {
    const incoming = imported[key];
    if (empty(incoming)) return [];
    const now = current[key];
    const status = empty(now) ? ("new" as const) : same(now, incoming) ? ("same" as const) : ("different" as const);
    return [{ key, label, status, current: now, incoming }];
  });
}
