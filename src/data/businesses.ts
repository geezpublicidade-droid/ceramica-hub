export type VirtualVisitType = "photos" | "video" | "iframe_360" | "matterport" | "external_url";

export type VirtualVisit = {
  active: boolean;
  type: VirtualVisitType | null;
  url: string | null;
  provider: string | null;
  thumbnail: string | null;
  description: string | null;
};

export type BusinessSeals = {
  /** = status === 'approved' */
  verified: boolean;
  addressVerified: boolean;
  photographed: boolean;
  /** = virtualVisit.active */
  virtualVisitAvailable: boolean;
  founder: boolean;
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  category: string;
  /** string pronta pra exibir, ex: "Torre Park · 5º andar · sala 102" */
  floor: string;
  description: string;
  instagram: string;
  phone: string;
  /** = status === 'approved' no banco — selo de verificação real, não um flag arbitrário */
  verified: boolean;
  initials: string;
  plan: "presenca" | "profissional" | "destaque" | "experiencia" | "premium";
  /** plano "de verdade" pra fins de exibição/gating: plan, ou trial.plan enquanto o trial estiver ativo e dentro do prazo */
  effectivePlan: "presenca" | "profissional" | "destaque" | "experiencia" | "premium";
  trial: {
    status: "none" | "active" | "expired";
    plan: "presenca" | "profissional" | "destaque" | "experiencia" | "premium" | null;
    endsAt: string | null;
  };
  status: "pending" | "approved" | "rejected" | "suspended";
  /** logo quadrado (1:1) da empresa — opcional; sem isso, o card mostra as iniciais */
  logo?: string;
  coverPhoto?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  openingHours?: string;
  videoUrl?: string;
  imageUsageAuthorized: boolean;
  virtualVisit: VirtualVisit;
  seals: BusinessSeals;
  updatedAt: string;
};

export const planLabels: Record<Business["plan"], string> = {
  presenca: "Presença Gratuita",
  profissional: "Profissional",
  destaque: "Destaque",
  experiencia: "Experiência",
  premium: "Premium",
};

export type BusinessService = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  photo: string | null;
  startingPrice: number | null;
  sortOrder: number;
  /** ex.: "45 min" (landing page) */
  duration?: string | null;
  /** texto do botão na landing; vazio = "Tenho interesse" */
  ctaLabel?: string | null;
  /** false = oculto na landing sem apagar */
  active?: boolean;
};

export const categories = [
  "Todas",
  "Contabilidade & Jurídico",
  "Saúde & Estética",
  "Alimentação",
  "Moda & Beleza",
  "Tecnologia & Marketing",
  "Educação",
  "Design & Arquitetura",
  "Investimentos",
  "Direito",
  "Laboratório",
  "Outros",
] as const;

/** provedores autorizados pro iframe da visita virtual — nunca aceitar domínio arbitrário */
export const VIRTUAL_VISIT_ALLOWED_HOSTS = [
  "my.matterport.com",
  "kuula.co",
  "momento360.com",
  "www.google.com", // Google Street View / Business embeds
] as const;
