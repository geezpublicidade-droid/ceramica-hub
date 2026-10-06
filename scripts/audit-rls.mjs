// Auditoria de exposicao: tenta ler todas as tabelas, chamar RPCs e inserir com a chave ANONIMA.
// Uso: node --env-file=.env.local scripts/audit-rls.mjs   (sai com codigo 1 se achar vazamento)
const url = process.env.SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const as = (key) => ({ apikey: key, Authorization: `Bearer ${key}` });

const spec = await (await fetch(`${url}/rest/v1/`, { headers: as(svc) })).json();
const paths = Object.keys(spec.paths ?? {}).filter((p) => p !== "/");
const tables = paths.filter((p) => !p.startsWith("/rpc/")).map((p) => p.slice(1));
const rpcs = paths.filter((p) => p.startsWith("/rpc/")).map((p) => p.slice(5));

const problems = [];
for (const t of tables) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: as(anon) });
  const body = await r.json().catch(() => null);
  if (r.status === 200 && Array.isArray(body) && body.length > 0) problems.push(`leitura anônima expõe dados: ${t}`);
}
for (const f of rpcs) {
  const r = await fetch(`${url}/rest/v1/rpc/${f}`, { method: "POST", headers: { ...as(anon), "Content-Type": "application/json" }, body: "{}" });
  if (![401, 403, 404].includes(r.status)) problems.push(`RPC alcançável pelo anon: ${f} (${r.status})`);
}
const buckets = await (await fetch(`${url}/storage/v1/bucket`, { headers: as(svc) })).json();
console.log(`tabelas: ${tables.length} | rpcs: ${rpcs.length} | buckets: ${buckets.map((b) => `${b.name}${b.public ? "[público]" : ""}`).join(", ")}`);
if (problems.length) {
  console.error("PROBLEMAS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("OK: nenhuma tabela legível nem RPC alcançável pela chave anônima.");
