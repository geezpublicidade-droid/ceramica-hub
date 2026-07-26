import { createServiceClient } from "@/lib/supabase/server";

const TARGET_LOCALES = ["en", "es", "zh"] as const;
type TargetLocale = (typeof TARGET_LOCALES)[number];

const DEEPL_TARGET_LANG: Record<TargetLocale, string> = {
  en: "EN-US",
  es: "ES",
  zh: "ZH",
};

export type TranslatableEntityType = "business" | "benefit" | "opportunity" | "business_service" | "virtual_tour_scene";

async function translateBatch(texts: string[], targetLocale: TargetLocale): Promise<string[]> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error("DEEPL_API_KEY não configurado no .env do projeto.");

  // Chaves do plano gratuito (API Free) terminam em ":fx" e usam um host diferente do plano pago.
  const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";

  const response = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      source_lang: "PT",
      target_lang: DEEPL_TARGET_LANG[targetLocale],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepL respondeu ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await response.json()) as { translations: { text: string }[] };
  return data.translations.map((t) => t.text);
}

/**
 * Traduz os campos de texto em português de uma entidade (produto do cadastro/edição
 * self-service) pra en/es/zh e grava em `content_translations`. Chamado de forma
 * síncrona logo após o save em português — se uma tradução falhar (chave ausente,
 * rate limit, etc.), o erro fica só logado: o registro em português já foi salvo
 * com sucesso, e as traduções faltantes caem pro fallback em português na leitura
 * até uma tentativa futura (nova edição, ou o script de backfill) preencher.
 */
export async function translateAndStore(
  entityType: TranslatableEntityType,
  entityId: string,
  fields: Record<string, string | null | undefined>,
): Promise<void> {
  const entries = Object.entries(fields).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0,
  );
  if (entries.length === 0) return;

  const fieldNames = entries.map(([name]) => name);
  const texts = entries.map(([, value]) => value);
  const supabase = createServiceClient();

  await Promise.all(
    TARGET_LOCALES.map(async (locale) => {
      try {
        const translated = await translateBatch(texts, locale);
        const rows = fieldNames.map((field, index) => ({
          entity_type: entityType,
          entity_id: entityId,
          locale,
          field,
          value: translated[index],
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase
          .from("content_translations")
          .upsert(rows, { onConflict: "entity_type,entity_id,locale,field" });
        if (error) throw error;
      } catch (err) {
        console.error(`[translate] falha ao traduzir ${entityType} ${entityId} -> ${locale}:`, err);
      }
    }),
  );
}

export type EntityTranslations = Record<string, Record<string, string>>;

/** Busca as traduções de um conjunto de entidades do mesmo tipo, num único idioma, já pivotadas por (entityId -> field -> value). */
export async function getTranslationsFor(
  entityType: TranslatableEntityType,
  entityIds: string[],
  locale: string,
): Promise<EntityTranslations> {
  const result: EntityTranslations = {};
  if (entityIds.length === 0 || locale === "pt") return result;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_translations")
    .select("entity_id, field, value")
    .eq("entity_type", entityType)
    .eq("locale", locale)
    .in("entity_id", entityIds);

  if (error) {
    console.error(`[translate] falha ao buscar traduções de ${entityType} (${locale}):`, error);
    return result;
  }

  for (const row of data ?? []) {
    result[row.entity_id] ??= {};
    result[row.entity_id][row.field] = row.value;
  }
  return result;
}
