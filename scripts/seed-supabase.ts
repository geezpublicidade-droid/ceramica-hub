import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

/**
 * Script de migração única: roda contra um Supabase novo/vazio pra recriar
 * os dados de demonstração que existiam em src/data/*.ts antes da troca pro
 * banco (ver platform.ts). Por isso os dados ficam embutidos aqui em vez de
 * importados — o shape de src/data já mudou pra refletir o schema do banco,
 * então importar de lá quebraria o propósito histórico deste script.
 */
const demoBusinesses = [
  { id: "conta-certa", name: "Conta Certa Contabilidade", category: "Contabilidade & Jurídico", floor: "3º andar", description: "Abertura de empresa, folha de pagamento e consultoria fiscal para quem empreende no prédio.", instagram: "@contacerta.contabil", phone: "5511999999999" },
  { id: "advocacia-reis", name: "Reis & Andrade Advocacia", category: "Contabilidade & Jurídico", floor: "5º andar", description: "Direito empresarial e trabalhista com atendimento rápido para quem está aqui do lado.", instagram: "@reisandrade.adv", phone: "5511999999999" },
  { id: "espaco-derme", name: "Espaço Derme Estética", category: "Saúde & Estética", floor: "2º andar", description: "Skincare, harmonização facial e procedimentos estéticos com equipe especializada.", instagram: "@espacoderme", phone: "5511999999999" },
  { id: "clinica-viva", name: "Clínica Viva Odontologia", category: "Saúde & Estética", floor: "4º andar", description: "Odontologia geral e estética. Convênio com empresas do prédio.", instagram: "@clinicaviva.odonto", phone: "5511999999999" },
  { id: "cantina-nonna", name: "Cantina da Nonna", category: "Alimentação", floor: "Térreo", description: "Marmitas e almoço executivo. Entrega para todos os andares em 10 minutos.", instagram: "@cantinadanonna", phone: "5511999999999" },
  { id: "cafe-do-predio", name: "Café do Prédio", category: "Alimentação", floor: "Térreo", description: "Cafeteria de especialidade, ponto de encontro informal entre empresas do Cerâmica.", instagram: "@cafedopredio", phone: "5511999999999" },
  { id: "atelie-lima", name: "Ateliê Lima Moda", category: "Moda & Beleza", floor: "6º andar", description: "Alfaiataria e consultoria de imagem para quem trabalha no corredor comercial.", instagram: "@ateliedolima", phone: "5511999999999" },
  { id: "barbearia-bloco", name: "Barbearia do Bloco", category: "Moda & Beleza", floor: "1º andar", description: "Corte, barba e alinhamento. Agenda expressa para intervalo de almoço.", instagram: "@barbeariadobloco", phone: "5511999999999" },
  { id: "geez-publicidade", name: "Geez Publicidade", category: "Tecnologia & Marketing", floor: "7º andar", description: "Sites, identidade visual e tráfego pago. A agência por trás do Cerâmica Hub.", instagram: "@geez.publicidade", phone: "5511999999999" },
  { id: "nuvem-tech", name: "Nuvem Tech Suporte", category: "Tecnologia & Marketing", floor: "5º andar", description: "Suporte de TI e infraestrutura para pequenas empresas do prédio.", instagram: "@nuvemtech", phone: "5511999999999" },
  { id: "ceramica-idiomas", name: "Cerâmica Idiomas", category: "Educação", floor: "8º andar", description: "Inglês e espanhol para profissionais, turmas fechadas por empresa.", instagram: "@ceramicaidiomas", phone: "5511999999999" },
  { id: "estudio-arq", name: "Estúdio Arquitetos Associados", category: "Design & Arquitetura", floor: "6º andar", description: "Projetos comerciais e residenciais, do conceito à obra.", instagram: "@estudioarquitetos", phone: "5511999999999" },
];

const demoBenefits = [
  { id: "conta-certa-indicacao", businessId: "conta-certa", kind: "desconto", title: "20% na abertura de empresa", description: "Pra quem indicar outra empresa do prédio na Conta Certa Contabilidade." },
  { id: "derme-avaliacao", businessId: "espaco-derme", kind: "avaliacao-gratis", title: "Avaliação facial gratuita", description: "O Espaço Derme oferece uma avaliação facial sem custo pra empresas do Cerâmica." },
  { id: "nonna-combo", businessId: "cantina-nonna", kind: "combo", title: "Combo executivo em grupo", description: "Desconto progressivo na Cantina da Nonna pra pedidos de 3 ou mais pessoas do mesmo andar." },
  { id: "barbearia-aniversario", businessId: "barbearia-bloco", kind: "cortesia", title: "Alinhamento de cortesia", description: "Barbearia do Bloco oferece um alinhamento de barba de cortesia no mês de aniversário da sua empresa." },
  { id: "nuvem-visita", businessId: "nuvem-tech", kind: "cortesia", title: "Primeira visita técnica grátis", description: "Nuvem Tech Suporte não cobra a primeira visita de diagnóstico pra empresas novas no prédio." },
  { id: "cafe-fidelidade", businessId: "cafe-do-predio", kind: "beneficio-funcionario", title: "Fidelidade entre empresas", description: "Café do Prédio aceita um cartão fidelidade único, compartilhado entre os funcionários de qualquer empresa do Cerâmica." },
];

const demoOpportunities = [
  { id: "viva-fotografo", businessId: "clinica-viva", type: "procura", title: "Procura um fotógrafo para o Instagram", description: "A Clínica Viva quer renovar o conteúdo das redes sociais e procura alguém do prédio pra fotografar o consultório e a equipe." },
  { id: "nonna-beneficio", businessId: "cantina-nonna", type: "oferece", title: "Desconto pra empresas do prédio", description: "A Cantina da Nonna oferece 15% de desconto no almoço executivo pra quem fecha pedido em grupo com outra empresa do Cerâmica." },
  { id: "reis-tech", businessId: "advocacia-reis", type: "parceria", title: "Busca parceiro de tecnologia", description: "A Reis & Andrade quer digitalizar a gestão de contratos e procura uma empresa de tecnologia do prédio pra tocar o projeto junto." },
  { id: "geez-estagio", businessId: "geez-publicidade", type: "contratando", title: "Contratando estágio em design", description: "A Geez Publicidade está com vaga aberta de estágio em design pra quem já circula pelo Cerâmica." },
  { id: "derme-fornecedor", businessId: "espaco-derme", type: "procura", title: "Procura fornecedor de skincare", description: "O Espaço Derme está buscando um novo fornecedor de produtos de skincare profissional — de preferência alguém que já atenda o prédio." },
  { id: "barbearia-acao", businessId: "barbearia-bloco", type: "parceria", title: "Busca empresas para ação conjunta", description: "A Barbearia do Bloco quer organizar uma ação de Dia dos Pais com outras empresas do prédio — procura quem topa entrar." },
];

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
      floor: business.floor,
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
