// Exporta TODOS os dados do projeto (tabelas + arquivos do Storage) para uma pasta local,
// para migrar de conta/projeto Supabase. Contem dados pessoais: nunca versionar nem enviar a terceiros.
// Uso: node --env-file=.env.local scripts/export-project.mjs [pasta-destino]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}` };
const stamp = new Date().toISOString().slice(0, 10);
const out = process.argv[2] ?? path.join("C:/Projetos/_backups", `ceramica-hub-${stamp}`);
const PAGE = 1000;

async function exportTables() {
  const spec = await (await fetch(`${url}/rest/v1/`, { headers: H })).json();
  const tables = Object.keys(spec.paths ?? {}).filter((p) => p !== "/" && !p.startsWith("/rpc/")).map((p) => p.slice(1));
  await mkdir(path.join(out, "tables"), { recursive: true });
  const manifest = {};
  for (const table of tables) {
    const rows = [];
    for (let from = 0; ; from += PAGE) {
      const r = await fetch(`${url}/rest/v1/${table}?select=*`, { headers: { ...H, Range: `${from}-${from + PAGE - 1}`, "Range-Unit": "items" } });
      if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
      const page = await r.json();
      rows.push(...page);
      if (page.length < PAGE) break;
    }
    await writeFile(path.join(out, "tables", `${table}.json`), JSON.stringify(rows));
    manifest[table] = rows.length;
  }
  return manifest;
}

async function listObjects(bucket, prefix = "") {
  const r = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  const items = await r.json();
  const files = [];
  for (const item of items) {
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) files.push(name);
    else files.push(...(await listObjects(bucket, name)));
  }
  return files;
}

async function exportStorage() {
  const buckets = await (await fetch(`${url}/storage/v1/bucket`, { headers: H })).json();
  const manifest = {};
  for (const bucket of buckets) {
    const files = await listObjects(bucket.name);
    let bytes = 0;
    for (const file of files) {
      const r = await fetch(`${url}/storage/v1/object/${bucket.name}/${file.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
      if (!r.ok) throw new Error(`${bucket.name}/${file}: ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const dest = path.join(out, "storage", bucket.name, file);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      bytes += buf.length;
    }
    manifest[bucket.name] = { public: bucket.public, files: files.length, bytes };
  }
  return manifest;
}

await mkdir(out, { recursive: true });
const tables = await exportTables();
const storage = await exportStorage();
const manifest = { exportedAt: new Date().toISOString(), supabaseUrl: url, tables, storage };
await writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
const rowCount = Object.values(tables).reduce((a, b) => a + b, 0);
console.log(`Exportado para ${out}\n${Object.keys(tables).length} tabelas, ${rowCount} linhas | buckets: ${JSON.stringify(storage)}`);
