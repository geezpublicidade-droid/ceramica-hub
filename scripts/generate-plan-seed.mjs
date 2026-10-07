// Gera supabase/migrations/0077_plan_features_seed.sql a partir da matriz de fabrica (src/lib/plans/features.ts).
// Uso: node --experimental-strip-types scripts/generate-plan-seed.mjs
import fs from "node:fs";
import { BUILT_IN_PLANS, DEFAULT_PLAN_FEATURES, FEATURE_KEYS } from "../src/lib/plans/features.ts";

const lit = (value) => (typeof value === "string" ? `'"${value}"'` : `'${JSON.stringify(value)}'`);
const rows = [];
for (const plan of BUILT_IN_PLANS) for (const key of FEATURE_KEYS) rows.push(`  ('${plan}', '${key}', ${lit(DEFAULT_PLAN_FEATURES[plan][key])}::jsonb)`);

const sql = `-- GERADO por scripts/generate-plan-seed.mjs a partir de src/lib/plans/features.ts. Nao editar a mao.
-- Seed dos recursos de cada plano. Idempotente e NAO sobrescreve ajustes feitos no admin (on conflict do nothing).
insert into plan_features (plan_key, feature_key, value) values
${rows.join(",\n")}
on conflict (plan_key, feature_key) do nothing;
`;
fs.writeFileSync("supabase/migrations/0077_plan_features_seed.sql", sql);
console.log(`ok: ${rows.length} linhas (${BUILT_IN_PLANS.length} planos x ${FEATURE_KEYS.length} recursos)`);
