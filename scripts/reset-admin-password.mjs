import { Client } from "pg";
import bcrypt from "bcryptjs";

const email = process.argv[2];
const newPassword = process.argv[3];
if (!email || !newPassword) {
  console.error("uso: node --env-file=.env.local scripts/reset-admin-password.mjs <email> <senha>");
  process.exit(1);
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING.split("?")[0];
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await client.query(
    "update admins set password_hash = $1 where email = $2 returning email",
    [hash, email]
  );
  console.log("Atualizado:", result.rows);
} finally {
  await client.end();
}
