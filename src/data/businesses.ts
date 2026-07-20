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
  plan: "presenca" | "destaque" | "experiencia";
  status: "pending" | "approved" | "rejected";
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
};

export const planLabels: Record<Business["plan"], string> = {
  presenca: "Presença",
  destaque: "Destaque",
  experiencia: "Experiência",
};

export type BusinessService = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  photo: string | null;
  startingPrice: number | null;
  sortOrder: number;
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
] as const;

/** provedores autorizados pro iframe da visita virtual — nunca aceitar domínio arbitrário */
export const VIRTUAL_VISIT_ALLOWED_HOSTS = [
  "my.matterport.com",
  "kuula.co",
  "momento360.com",
  "www.google.com", // Google Street View / Business embeds
] as const;
