// Traduz (via DeepL) o conteúdo já cadastrado pelas empresas — nome de serviço,
// descrição, benefícios, oportunidades, cena de visita virtual — pra en/es/zh,
// preenchendo `content_translations` pros registros que ainda não têm tradução.
// Idempotente: só chama a DeepL pros campos que ainda não têm linha gravada
// pro idioma em questão, então rodar de novo depois de um novo cadastro é seguro
// e não gasta cota traduzindo o que já foi traduzido.
//
// uso:
//   node --env-file=.env.local scripts/backfill-translations.mjs --dry-run
//   node --env-file=.env.local scripts/backfill-translations.mjs

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const TARGET_LOCALES = ["en", "es", "zh"];
const DEEPL_TARGET_LANG = { en: "EN-US", es: "ES", zh: "ZH" };

if (!DRY_RUN && !process.env.DEEPL_API_KEY) {
  console.error(
    "DEEPL_API_KEY não configurado no .env.local. Rode com --dry-run pra só ver o que falta traduzir, ou configure a chave antes de rodar de verdade."
  );
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function translateBatch(texts, locale) {
  const apiKey = process.env.DEEPL_API_KEY;
  const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const response = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texts, source_lang: "PT", target_lang: DEEPL_TARGET_LANG[locale] }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepL respondeu ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.translations.map((t) => t.text);
}

async function loadExistingKeys() {
  const { data, error } = await supabase.from("content_translations").select("entity_type, entity_id, locale, field");
  if (error) throw error;
  return new Set((data ?? []).map((row) => `${row.entity_type}:${row.entity_id}:${row.locale}:${row.field}`));
}

async function processEntity(entityType, entityId, fields, existingKeys, stats) {
  const nonEmpty = Object.entries(fields).filter(([, value]) => typeof value === "string" && value.trim().length > 0);
  if (nonEmpty.length === 0) return;

  for (const locale of TARGET_LOCALES) {
    const missing = nonEmpty.filter(([field]) => !existingKeys.has(`${entityType}:${entityId}:${locale}:${field}`));
    if (missing.length === 0) continue;

    stats.pending += 1;
    console.log(
      `${DRY_RUN ? "[DRY RUN] " : ""}${entityType} ${entityId} -> ${locale}: ${missing.map(([field]) => field).join(", ")}`
    );
    if (DRY_RUN) continue;

    try {
      const translated = await translateBatch(
        missing.map(([, value]) => value),
        locale
      );
      const rows = missing.map(([field], index) => ({
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
      stats.ok += 1;
    } catch (err) {
      console.error(`  FAIL: ${entityType} ${entityId} (${locale}): ${err.message}`);
      stats.fail += 1;
    }
  }
}

async function main() {
  const existingKeys = await loadExistingKeys();
  const stats = { pending: 0, ok: 0, fail: 0 };

  const [businesses, services, benefits, opportunities, scenes] = await Promise.all([
    supabase.from("businesses").select("id, description, opening_hours, virtual_visit_description"),
    supabase.from("business_services").select("id, name, description"),
    supabase.from("benefits").select("id, title, description"),
    supabase.from("opportunities").select("id, title, description"),
    supabase.from("virtual_tour_scenes").select("id, label"),
  ]);

  for (const row of businesses.data ?? []) {
    await processEntity(
      "business",
      row.id,
      { description: row.description, opening_hours: row.opening_hours, virtual_visit_description: row.virtual_visit_description },
      existingKeys,
      stats
    );
  }
  for (const row of services.data ?? []) {
    await processEntity("business_service", row.id, { name: row.name, description: row.description }, existingKeys, stats);
  }
  for (const row of benefits.data ?? []) {
    await processEntity("benefit", row.id, { title: row.title, description: row.description }, existingKeys, stats);
  }
  for (const row of opportunities.data ?? []) {
    await processEntity("opportunity", row.id, { title: row.title, description: row.description }, existingKeys, stats);
  }
  for (const row of scenes.data ?? []) {
    await processEntity("virtual_tour_scene", row.id, { label: row.label }, existingKeys, stats);
  }

  console.log(
    `\n${DRY_RUN ? "Dry-run concluído" : "Backfill concluído"}: ${stats.pending} traduções pendentes encontradas${
      DRY_RUN ? "" : `, ${stats.ok} ok, ${stats.fail} falharam`
    }.`
  );
}

main();
