import { readFileSync } from "node:fs";
import { Client } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("uso: node --env-file=.env.local scripts/run-sql.mjs <arquivo.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const connectionString = process.env.POSTGRES_URL_NON_POOLING.split("?")[0];
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log(`OK: ${file} executado.`);
} finally {
  await client.end();
}
