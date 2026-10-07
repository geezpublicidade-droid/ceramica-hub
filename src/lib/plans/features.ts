/**
 * MATRIZ CENTRAL DE RECURSOS POR PLANO.
 *
 * Única definição dos recursos que um plano libera. O banco (tabelas `plans` e `plan_features`) é a fonte editável
 * em produção; esta matriz é o padrão de fábrica: gera o seed das migrations, serve de fallback se o banco falhar e
 * completa recursos novos que ainda não existam no banco. Nenhum componente deve olhar o NOME do plano: use
 * `canAccess`/`getLimit` sobre o mapa de recursos já resolvido (ver resolve.ts).
 */

export const UNLIMITED = "unlimited" as const;
export const FREE_PLAN = "presenca";

/** Planos de fábrica. O sistema aceita outros (criados no admin) — por isso `PlanKey` é string. */
export const BUILT_IN_PLANS = ["presenca", "profissional", "destaque", "experiencia", "premium", "patrocinador"] as const;
export type BuiltInPlan = (typeof BUILT_IN_PLANS)[number];
export type PlanKey = string;

export type FeatureValue = boolean | number | string;
export type FeatureKind = "limit" | "flag" | "enum";

export const FEATURE_GROUPS = {
  profile: "Perfil público",
  content: "Conteúdo",
  landing: "Landing page",
  visibility: "Visibilidade e posicionamento",
  metrics: "Métricas",
  premium: "Benefícios Premium",
  sponsor: "Patrocínio",
} as const;
export type FeatureGroup = keyof typeof FEATURE_GROUPS;

type FeatureDef = {
  key: string;
  kind: FeatureKind;
  group: FeatureGroup;
  label: string;
  /** enum: opções válidas; o primeiro valor de `offValues` conta como "recurso desligado" */
  options?: readonly string[];
  offValues?: readonly string[];
};

const DEFS = [
  // --- perfil público ---
  { key: "basic_page", kind: "flag", group: "profile", label: "Página básica (nome, logo, categoria, torre, andar e sala)" },
  { key: "claim_profile", kind: "flag", group: "profile", label: "Reivindicar o perfil" },
  { key: "full_description", kind: "flag", group: "profile", label: "Descrição completa" },
  { key: "whatsapp", kind: "flag", group: "profile", label: "WhatsApp" },
  { key: "contact_button", kind: "flag", group: "profile", label: "Botão principal de contato" },
  { key: "social_media", kind: "flag", group: "profile", label: "Redes sociais" },
  { key: "business_hours", kind: "flag", group: "profile", label: "Horário de funcionamento" },
  { key: "commercial_info", kind: "flag", group: "profile", label: "Informações comerciais completas" },
  { key: "sponsored_badge", kind: "flag", group: "profile", label: "Selo de empresa patrocinada" },
  { key: "support", kind: "flag", group: "profile", label: "Suporte" },
  // --- conteúdo ---
  { key: "services", kind: "limit", group: "content", label: "Serviços" },
  { key: "service_photos", kind: "flag", group: "content", label: "Foto e descrição em cada serviço" },
  { key: "gallery_images", kind: "limit", group: "content", label: "Fotos na galeria" },
  { key: "active_promotions", kind: "limit", group: "content", label: "Promoções ativas" },
  { key: "trackable_coupons", kind: "flag", group: "content", label: "Cupons rastreáveis" },
  { key: "featured_videos", kind: "limit", group: "content", label: "Vídeos em destaque" },
  { key: "opportunities", kind: "flag", group: "content", label: "Publicação de oportunidades" },
  { key: "stories_weekly", kind: "flag", group: "content", label: "Promoção semanal nos Stories" },
  // --- landing page ---
  { key: "landing_layout", kind: "enum", group: "landing", label: "Layout da página pública", options: ["basic", "standard", "landing"], offValues: ["basic"] },
  { key: "custom_hero", kind: "flag", group: "landing", label: "Hero personalizado (capa, título e proposta de valor)" },
  { key: "custom_sections", kind: "flag", group: "landing", label: "Seções personalizadas e diferenciais" },
  { key: "custom_cta", kind: "flag", group: "landing", label: "CTAs personalizados" },
  { key: "faq", kind: "flag", group: "landing", label: "Perguntas frequentes (FAQ)" },
  { key: "lead_forms", kind: "flag", group: "landing", label: "Formulário próprio (leads para o WhatsApp)" },
  { key: "tour_3d", kind: "flag", group: "landing", label: "Tour virtual 3D da sala" },
  // --- visibilidade ---
  { key: "priority_level", kind: "limit", group: "visibility", label: "Nível de prioridade no posicionamento (0 a 5)" },
  { key: "sponsor_top_priority", kind: "flag", group: "visibility", label: "Prioridade de patrocinador (campanha) acima dos demais" },
  { key: "category_priority", kind: "flag", group: "visibility", label: "Prioridade na categoria" },
  { key: "search_priority", kind: "flag", group: "visibility", label: "Prioridade nos resultados de busca" },
  { key: "rotating_card", kind: "flag", group: "visibility", label: "Destaque rotativo nos cards" },
  { key: "featured_badge", kind: "flag", group: "visibility", label: "Selo visual “Em destaque”" },
  { key: "premium_badge", kind: "flag", group: "visibility", label: "Selo Premium" },
  { key: "featured_home_priority", kind: "flag", group: "visibility", label: "Prioridade máxima em “Empresas em Destaque”" },
  { key: "editorial_occasional", kind: "flag", group: "visibility", label: "Destaque editorial ocasional" },
  { key: "geez_discount", kind: "enum", group: "visibility", label: "Condições na Geez Marketing", options: ["none", "special", "premium"], offValues: ["none"] },
  // --- métricas (cumulativas) ---
  { key: "metrics_summary", kind: "flag", group: "metrics", label: "Resumo de visualizações" },
  { key: "metrics_basic", kind: "flag", group: "metrics", label: "Métricas básicas (visualizações, cliques, promoções e cupons)" },
  { key: "metrics_full", kind: "flag", group: "metrics", label: "Métricas completas (origem, serviços, formulários, conversão, dispositivos, período livre)" },
  { key: "metrics_premium", kind: "flag", group: "metrics", label: "Relatórios completos (destaques, categorias, exposição institucional, ações)" },
  { key: "metrics_campaign", kind: "flag", group: "metrics", label: "Métricas de campanhas (impressões, cliques, CTR, entregas)" },
  // --- benefícios premium ---
  { key: "tour3d_productions_per_cycle", kind: "limit", group: "premium", label: "Produções 3D por ciclo" },
  { key: "institutional_content", kind: "flag", group: "premium", label: "Conteúdo institucional especial" },
  { key: "networking_priority", kind: "flag", group: "premium", label: "Prioridade em encontros empresariais" },
  { key: "networking_meals", kind: "flag", group: "premium", label: "Café ou almoço de networking" },
  { key: "special_actions_priority", kind: "flag", group: "premium", label: "Prioridade em ações especiais do Hub" },
  { key: "premium_benefits", kind: "flag", group: "premium", label: "Pacote de benefícios Premium (ativado manualmente no patrocínio)" },
  // --- patrocínio ---
  { key: "custom_proposal", kind: "flag", group: "sponsor", label: "Proposta personalizada" },
  { key: "exclusive_ad_spaces", kind: "flag", group: "sponsor", label: "Espaços exclusivos de publicidade" },
  { key: "activations", kind: "flag", group: "sponsor", label: "Ativações" },
  { key: "institutional_presence", kind: "flag", group: "sponsor", label: "Presença institucional" },
  { key: "diagnostic_meeting", kind: "flag", group: "sponsor", label: "Reunião de diagnóstico" },
  { key: "institutional_landing", kind: "flag", group: "sponsor", label: "Landing page institucional" },
  { key: "campaign_segmentation", kind: "flag", group: "sponsor", label: "Segmentação por categoria e por página" },
  { key: "impressions_control", kind: "flag", group: "sponsor", label: "Controle de impressões e cliques" },
  { key: "banner_home", kind: "flag", group: "sponsor", label: "Banner na home" },
  { key: "banner_category", kind: "flag", group: "sponsor", label: "Banner nas categorias" },
  { key: "sponsor_carousel", kind: "flag", group: "sponsor", label: "Carrossel de patrocinadores" },
  { key: "editorial_content", kind: "flag", group: "sponsor", label: "Conteúdo editorial" },
  { key: "sponsored_event", kind: "flag", group: "sponsor", label: "Evento patrocinado" },
  { key: "segment_exclusivity", kind: "flag", group: "sponsor", label: "Exclusividade por segmento" },
  { key: "insertions_count", kind: "limit", group: "sponsor", label: "Número de inserções contratadas" },
] as const satisfies readonly FeatureDef[];

export type FeatureKey = (typeof DEFS)[number]["key"];
export type FeatureMap = Record<FeatureKey, FeatureValue>;
export type FeatureDefinition = FeatureDef & { key: FeatureKey };

export const FEATURE_DEFINITIONS: readonly FeatureDefinition[] = DEFS;
export const FEATURE_KEYS: readonly FeatureKey[] = DEFS.map((def) => def.key);

/** Empresas "master" (a própria Geez): todos os recursos ligados e sem limite, em qualquer plano contratado. */
export const MASTER_BUSINESS_SLUGS: readonly string[] = ["geez-marketing"];

/** Nível de prioridade já vai de 0 a 5: o teto vale, não "ilimitado". */
const MAX_PRIORITY_LEVEL = 5;

export function masterFeatures(base: Readonly<FeatureMap>): FeatureMap {
  const map: FeatureMap = { ...base };
  for (const def of DEFS) {
    if (def.kind === "flag") map[def.key] = true;
    if (def.kind === "limit") map[def.key] = def.key === "priority_level" ? MAX_PRIORITY_LEVEL : UNLIMITED;
  }
  return map;
}

const DEF_BY_KEY = new Map<string, FeatureDefinition>(DEFS.map((def) => [def.key, def]));

export function featureDefinition(key: string): FeatureDefinition | undefined {
  return DEF_BY_KEY.get(key);
}

export function isFeatureKey(key: string): key is FeatureKey {
  return DEF_BY_KEY.has(key);
}

/** Nomes alternativos aceitos pela API pública (`canAccess("featured_video")`). */
const ALIASES: Record<string, FeatureKey> = {
  featured_video: "featured_videos",
  coupons: "trackable_coupons",
  lead_form: "lead_forms",
  custom_sections_enabled: "custom_sections",
  full_metrics: "metrics_full",
  basic_metrics: "metrics_basic",
  gallery: "gallery_images",
  promotions: "active_promotions",
};

export function normalizeFeatureKey(key: string): FeatureKey | null {
  if (isFeatureKey(key)) return key;
  return ALIASES[key] ?? null;
}

// ---------------------------------------------------------------------------------------------------------------
// Padrão de fábrica por plano
// ---------------------------------------------------------------------------------------------------------------

/** Posição do plano na escada (0 = gratuito). Patrocinador parte da base do Experiência. */
const RANK: Record<BuiltInPlan, number> = { presenca: 0, profissional: 1, destaque: 2, experiencia: 3, premium: 4, patrocinador: 3 };

const byRank = <T extends FeatureValue>(values: readonly [T, T, T, T, T]) => (rank: number): T => values[Math.min(rank, 4)];
const atLeast = (minRank: number) => (rank: number) => rank >= minRank;

const RULES: Record<FeatureKey, (rank: number) => FeatureValue> = {
  basic_page: atLeast(0),
  claim_profile: atLeast(0),
  full_description: atLeast(1),
  whatsapp: atLeast(1),
  contact_button: atLeast(1),
  social_media: atLeast(1),
  business_hours: atLeast(1),
  commercial_info: atLeast(1),
  sponsored_badge: atLeast(1),
  support: atLeast(1),
  services: byRank<FeatureValue>([0, 3, 6, UNLIMITED, UNLIMITED]),
  service_photos: atLeast(1),
  gallery_images: byRank([0, 3, 6, 30, 30]),
  active_promotions: byRank<FeatureValue>([0, 1, 4, UNLIMITED, UNLIMITED]),
  trackable_coupons: atLeast(2),
  featured_videos: byRank([0, 0, 0, 1, 3]),
  opportunities: atLeast(2),
  stories_weekly: atLeast(2),
  landing_layout: byRank(["basic", "standard", "standard", "landing", "landing"]),
  custom_hero: atLeast(3),
  custom_sections: atLeast(3),
  custom_cta: atLeast(3),
  faq: atLeast(3),
  lead_forms: atLeast(3),
  tour_3d: atLeast(4),
  priority_level: byRank([0, 1, 2, 3, 4]),
  sponsor_top_priority: () => false,
  category_priority: atLeast(2),
  search_priority: atLeast(2),
  rotating_card: atLeast(2),
  featured_badge: atLeast(2),
  premium_badge: atLeast(4),
  featured_home_priority: atLeast(4),
  editorial_occasional: atLeast(3),
  geez_discount: byRank(["none", "none", "special", "premium", "premium"]),
  metrics_summary: atLeast(1),
  metrics_basic: atLeast(2),
  metrics_full: atLeast(3),
  metrics_premium: atLeast(4),
  metrics_campaign: () => false,
  tour3d_productions_per_cycle: byRank([0, 0, 0, 0, 1]),
  institutional_content: atLeast(4),
  networking_priority: atLeast(4),
  networking_meals: atLeast(4),
  special_actions_priority: atLeast(4),
  premium_benefits: () => false,
  custom_proposal: () => false,
  exclusive_ad_spaces: () => false,
  activations: () => false,
  institutional_presence: () => false,
  diagnostic_meeting: () => false,
  institutional_landing: () => false,
  campaign_segmentation: () => false,
  impressions_control: () => false,
  banner_home: () => false,
  banner_category: () => false,
  sponsor_carousel: () => false,
  editorial_content: () => false,
  sponsored_event: () => false,
  segment_exclusivity: () => false,
  insertions_count: () => 0,
};

/** O que o plano Patrocinador acrescenta à base do Experiência. O resto (tour 3D, banners, etc.) é ativado por override. */
const SPONSOR_BASE: Partial<Record<FeatureKey, FeatureValue>> = {
  priority_level: 4,
  metrics_campaign: true,
  custom_proposal: true,
  exclusive_ad_spaces: true,
  activations: true,
  institutional_presence: true,
  diagnostic_meeting: true,
  institutional_landing: true,
  campaign_segmentation: true,
  impressions_control: true,
};

function buildDefaults(plan: BuiltInPlan): FeatureMap {
  const rank = RANK[plan];
  const map = Object.fromEntries(FEATURE_KEYS.map((key) => [key, RULES[key](rank)])) as FeatureMap;
  return plan === "patrocinador" ? { ...map, ...SPONSOR_BASE } : map;
}

/** Padrão de fábrica de cada plano (derivado das regras acima; nunca mute este objeto). */
export const DEFAULT_PLAN_FEATURES: Readonly<Record<BuiltInPlan, Readonly<FeatureMap>>> = Object.freeze(
  Object.fromEntries(BUILT_IN_PLANS.map((plan) => [plan, Object.freeze(buildDefaults(plan))])) as Record<BuiltInPlan, Readonly<FeatureMap>>,
);

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  description: string;
  /** posição na escada de upgrade (menor = mais barato) */
  rank: number;
  active: boolean;
  /** aparece na página pública de planos */
  isPublic: boolean;
  /** plano de fábrica: não pode ser excluído */
  isSystem: boolean;
  billingType: "mensal" | "personalizado";
};

export const DEFAULT_PLAN_DEFINITIONS: readonly PlanDefinition[] = [
  { key: "presenca", name: "Presença Gratuita", description: "Comece sua presença no Cerâmica sem custo.", rank: 0, active: true, isPublic: true, isSystem: true, billingType: "mensal" },
  { key: "profissional", name: "Profissional", description: "Página comercial padronizada, para empresas que já querem crescer.", rank: 1, active: true, isPublic: true, isSystem: true, billingType: "mensal" },
  { key: "destaque", name: "Destaque", description: "Para quem quer aparecer primeiro e ser visto por mais gente.", rank: 2, active: true, isPublic: true, isSystem: true, billingType: "mensal" },
  { key: "experiencia", name: "Experiência", description: "Landing page completa e personalizada, com serviços ilimitados.", rank: 3, active: true, isPublic: true, isSystem: true, billingType: "mensal" },
  { key: "premium", name: "Premium", description: "A maior visibilidade dentro do ecossistema Cerâmica.", rank: 4, active: true, isPublic: true, isSystem: true, billingType: "mensal" },
  { key: "patrocinador", name: "Patrocinador", description: "Proposta sob medida, com base no Experiência e benefícios ativados na negociação.", rank: 5, active: true, isPublic: true, isSystem: true, billingType: "personalizado" },
];

export const PLAN_FEATURE_FALLBACK: Readonly<FeatureMap> = DEFAULT_PLAN_FEATURES[FREE_PLAN];
