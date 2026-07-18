import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { businesses as demoBusinesses } from "../src/data/businesses";
import { benefits as demoBenefits } from "../src/data/benefits";
import { opportunities as demoOpportunities } from "../src/data/opportunities";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// mesma senha demo usada em toda a sessão anterior: ceramica2026
const DEMO_PASSWORD_HASH = "$2b$10$ONsD0ZHsd8DoZfT/3o21neC4vsve4q2TaLhtAlPaBeQ6QJrlCboGe";

const DEMO_EMAILS: Record<string, string> = {
  "geez-publicidade": "geez@ceramicahub.com.br",
  "conta-certa": "contacerta@ceramicahub.com.br",
  "espaco-derme": "derme@ceramicahub.com.br",
};

const towers = [
  {
    complex_name: "Network Business Tower",
    name: "Torre Park",
    address: "Alameda Terracota, 185 – Cerâmica – São Caetano do Sul/SP",
    cep: "09531-190",
    active: true,
    sort_order: 1,
  },
  {
    complex_name: "Network Business Tower",
    name: "Torre Union",
    address: "Alameda Terracota, 215 – Cerâmica – São Caetano do Sul/SP",
    cep: "09531-190",
    active: true,
    sort_order: 2,
  },
  {
    complex_name: "SAO International Square",
    name: "Torre Way",
    address: "Alameda Terracota, 250 – Cerâmica – São Caetano do Sul/SP",
    cep: "09531-190",
    active: true,
    sort_order: 3,
  },
  {
    complex_name: "SAO International Square",
    name: "Torre Gate",
    address: "Alameda Caulim, 115 – Cerâmica – São Caetano do Sul/SP",
    cep: "09531-195",
    active: true,
    sort_order: 4,
  },
  {
    complex_name: "Hub & Line Corporate",
    name: "Torre Hub",
    address: "Previsão 2028 — endereço ainda não divulgado",
    cep: "",
    active: false,
    sort_order: 5,
  },
  {
    complex_name: "Hub & Line Corporate",
    name: "Torre Line",
    address: "Previsão 2028 — endereço ainda não divulgado",
    cep: "",
    active: false,
    sort_order: 6,
  },
];

function floorNumber(floor: string): string {
  const match = floor.match(/\d+/);
  return match ? match[0] : "0";
}

async function main() {
  console.log("Seedando towers...");
  const { data: insertedTowers, error: towersError } = await supabase
    .from("towers")
    .insert(towers)
    .select("id, name");
  if (towersError) throw towersError;

  const activeTowers = insertedTowers.filter((t) => towers.find((x) => x.name === t.name)?.active);

  console.log("Seedando businesses...");
  const businessRows = demoBusinesses.map((business, index) => {
    const tower = activeTowers[index % activeTowers.length];
    return {
      email: DEMO_EMAILS[business.id] ?? `${business.id}@ceramicahub.com.br`,
      password_hash: DEMO_PASSWORD_HASH,
      name: business.name,
      category: business.category,
      description: business.description,
      instagram: business.instagram,
      phone: business.phone,
      tower_id: tower.id,
      floor: floorNumber(business.floor),
      room_number: String(101 + index),
      plan: business.id === "geez-publicidade" ? "destaque" : "free",
      status: "approved",
      _legacyId: business.id,
    };
  });

  const { data: insertedBusinesses, error: businessesError } = await supabase
    .from("businesses")
    .insert(businessRows.map(({ _legacyId, ...row }) => row))
    .select("id, email");
  if (businessesError) throw businessesError;

  const idByLegacy = new Map<string, string>();
  businessRows.forEach((row, index) => {
    idByLegacy.set(row._legacyId, insertedBusinesses[index].id);
  });

  console.log("Seedando benefits...");
  const { error: benefitsError } = await supabase.from("benefits").insert(
    demoBenefits.map((benefit) => ({
      business_id: idByLegacy.get(benefit.businessId),
      kind: benefit.kind,
      title: benefit.title,
      description: benefit.description,
    }))
  );
  if (benefitsError) throw benefitsError;

  console.log("Seedando opportunities...");
  const { error: opportunitiesError } = await supabase.from("opportunities").insert(
    demoOpportunities.map((opportunity) => ({
      business_id: idByLegacy.get(opportunity.businessId),
      type: opportunity.type,
      title: opportunity.title,
      description: opportunity.description,
    }))
  );
  if (opportunitiesError) throw opportunitiesError;

  console.log("Seedando admin...");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Defina SEED_ADMIN_PASSWORD no ambiente antes de rodar o seed.");
  }
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const { error: adminError } = await supabase.from("admins").insert({
    email: "geezpublicidade@gmail.com",
    password_hash: adminHash,
  });
  if (adminError) throw adminError;

  console.log("Seed concluído:");
  console.log(`- ${towers.length} towers (${activeTowers.length} ativas)`);
  console.log(`- ${insertedBusinesses.length} businesses`);
  console.log(`- 1 admin (geezpublicidade@gmail.com)`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
