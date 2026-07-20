import { Client } from "pg";
import { writeFileSync } from "node:fs";

const connectionString = process.env.POSTGRES_URL_NON_POOLING.split("?")[0];
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const backup = {};
for (const table of ["businesses", "business_photos", "business_services", "benefits", "opportunities", "towers", "admins", "metrics_events"]) {
  const res = await client.query(`select * from ${table}`);
  backup[table] = res.rows;
}
await client.end();

const path = `backup-pre-cleanup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(path, JSON.stringify(backup, null, 2));
console.log(`Backup salvo em ${path}`);
for (const [table, rows] of Object.entries(backup)) {
  console.log(`${table}: ${rows.length} linhas`);
}
