export type Business = {
  id: string;
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
  plan: "free" | "destaque";
  status: "pending" | "approved" | "rejected";
  /** logo quadrado (1:1) da empresa — opcional; sem isso, o card mostra as iniciais */
  logo?: string;
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
