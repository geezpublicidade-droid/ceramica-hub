import type { Business } from "@/data/businesses";
import { limitsFor } from "@/lib/plan-limits";
import { editarHref } from "@/lib/dashboard-anchors";

export type PresenceScoreCriterion = {
  key: "identidade" | "fotos" | "servicos" | "canais" | "horario" | "promocao" | "atualizado";
  label: string;
  points: number;
  maxPoints: number;
  met: boolean;
  actionHref: string;
  actionLabel: string;
};

export type PresenceScore = {
  total: number;
  criteria: PresenceScoreCriterion[];
  /** met === false, na mesma ordem de prioridade dos critérios abaixo */
  missing: PresenceScoreCriterion[];
};

const UPDATED_RECENTLY_DAYS = 60;
const PHOTO_SCORE_CEILING = 5;

function daysSince(dateIso: string): number {
  return (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Calcula o índice de presença digital (0-100) de uma empresa, só com dado
 * real já lido pela página que chama — não faz query própria.
 *
 * Desvios da fórmula original em relação ao pedido:
 * - `category` fica de fora dos 30 pontos de "identidade": é campo
 *   obrigatório no cadastro (sempre presente), incluí-lo infla o score sem
 *   refletir esforço real do empresário.
 * - "Contatos e WhatsApp" virou `websiteUrl`/`bookingUrl`: `phone` também é
 *   obrigatório no cadastro (sempre presente), então não varia entre
 *   empresas — usar como critério seria pontuação de graça.
 * - "Fotos" usa um teto fixo de 5 (não o limite do plano): usar
 *   `limitsFor(plan).maxPhotos` puniria pra sempre quem está no plano
 *   Presença (máx. 1 foto permitida).
 */
export function calculatePresenceScore(input: {
  business: Business;
  serviceCount: number;
  photoCount: number;
  hasActivePromotion: boolean;
}): PresenceScore {
  const { business, serviceCount, photoCount, hasActivePromotion } = input;
  const limits = limitsFor(business.plan);

  const daysSinceUpdate = daysSince(business.updatedAt);
  const identidadePoints =
    (business.description.trim() ? 12 : 0) +
    (business.instagram.trim() ? 6 : 0) +
    (business.logo ? 8 : 0) +
    (business.websiteUrl || business.bookingUrl ? 4 : 0);
  const fotosPoints = Math.round((Math.min(photoCount, PHOTO_SCORE_CEILING) / PHOTO_SCORE_CEILING) * 20);

  const criteria: PresenceScoreCriterion[] = [
    {
      key: "identidade",
      label: "Informações e identidade",
      points: identidadePoints,
      maxPoints: 30,
      met: identidadePoints === 30,
      actionHref: editarHref("perfil"),
      actionLabel: "Complete a descrição, Instagram, logo e site/agendamento",
    },
    {
      key: "fotos",
      label: "Fotos",
      points: fotosPoints,
      maxPoints: 20,
      met: photoCount > 0,
      actionHref: editarHref("fotos"),
      actionLabel: "Adicione fotos da sua empresa",
    },
    {
      key: "servicos",
      label: "Serviços cadastrados",
      points: serviceCount > 0 ? 15 : 0,
      maxPoints: 15,
      met: serviceCount > 0,
      actionHref: editarHref("servicos"),
      actionLabel: "Cadastre seus serviços",
    },
    {
      key: "canais",
      label: "Site ou agendamento",
      points: business.websiteUrl || business.bookingUrl ? 10 : 0,
      maxPoints: 10,
      met: Boolean(business.websiteUrl || business.bookingUrl),
      actionHref: editarHref("perfil"),
      actionLabel: "Adicione um link de agendamento ou site",
    },
    {
      key: "horario",
      label: "Horário de funcionamento",
      points: business.openingHours ? 10 : 0,
      maxPoints: 10,
      met: Boolean(business.openingHours),
      actionHref: editarHref("perfil"),
      actionLabel: "Informe seu horário de funcionamento",
    },
    {
      key: "promocao",
      label: "Promoção ativa",
      points: hasActivePromotion ? 10 : 0,
      maxPoints: 10,
      met: hasActivePromotion || limits.maxPromotions === 0,
      actionHref: editarHref("promocoes"),
      actionLabel: "Crie uma promoção para esta semana",
    },
    {
      key: "atualizado",
      label: "Conteúdo atualizado recentemente",
      points: daysSinceUpdate <= UPDATED_RECENTLY_DAYS ? 5 : 0,
      maxPoints: 5,
      met: daysSinceUpdate <= UPDATED_RECENTLY_DAYS,
      actionHref: editarHref("perfil"),
      actionLabel: "Revise e atualize seu conteúdo",
    },
  ];

  // "canais" e "promocao" não entram na recomendação de próximo passo pela
  // mesma ordem de prioridade do índice -- eles têm um lugar fixo na lista
  // de prioridade (seção 4 do plano), tratado por getNextStepRecommendation.
  const total = criteria.reduce((sum, criterion) => sum + criterion.points, 0);
  const missing = criteria.filter((criterion) => !criterion.met);

  return { total, criteria, missing };
}

export type NextStepRecommendation = {
  message: string;
  actionLabel: string;
  actionHref: string;
} | null;

/**
 * Escolhe UMA recomendação por vez, em ordem de prioridade fixa (o que é
 * mais rápido/impactante de resolver primeiro) -- não é simplesmente o
 * primeiro item de `criteria` na ordem de pontos. `null` = perfil completo,
 * mostrar reforço positivo em vez de recomendação.
 *
 * Não deriva de `calculatePresenceScore(...).missing` de propósito: o
 * critério "identidade" do índice agrupa 4 sinais (descrição/Instagram/
 * logo/site) numa pontuação só, mas aqui description precisa ser checada
 * sozinha primeiro -- senão uma empresa com descrição preenchida mas sem
 * Instagram apareceria pedindo pra "escrever descrição" de novo.
 */
export function getNextStepRecommendation(input: {
  business: Business;
  serviceCount: number;
  photoCount: number;
  hasActivePromotion: boolean;
}): NextStepRecommendation {
  const { business, serviceCount, photoCount, hasActivePromotion } = input;
  const limits = limitsFor(business.plan);
  const daysSinceUpdate = daysSince(business.updatedAt);

  if (!business.description.trim()) {
    return {
      message: "Escreva sobre sua empresa para que visitantes entendam o que você oferece.",
      actionLabel: "Escrever descrição",
      actionHref: editarHref("perfil"),
    };
  }
  if (photoCount === 0) {
    return {
      message: "Adicione fotos da sua empresa para fortalecer sua presença.",
      actionLabel: "Adicionar fotos",
      actionHref: editarHref("fotos"),
    };
  }
  if (serviceCount === 0) {
    return {
      message: "Cadastre seus principais serviços.",
      actionLabel: "Cadastrar serviços",
      actionHref: editarHref("servicos"),
    };
  }
  if (!business.websiteUrl && !business.bookingUrl) {
    return {
      message: "Adicione um link de agendamento ou site à sua página.",
      actionLabel: "Adicionar link",
      actionHref: editarHref("perfil"),
    };
  }
  if (!business.openingHours) {
    return {
      message: "Informe seu horário de funcionamento.",
      actionLabel: "Informar horário",
      actionHref: editarHref("perfil"),
    };
  }
  if (!hasActivePromotion && limits.maxPromotions > 0) {
    return {
      message: "Crie uma promoção para esta semana.",
      actionLabel: "Criar promoção",
      actionHref: editarHref("promocoes"),
    };
  }
  if (daysSinceUpdate > UPDATED_RECENTLY_DAYS) {
    return {
      message: `Seu perfil não é atualizado há mais de ${UPDATED_RECENTLY_DAYS} dias. Revise seu conteúdo.`,
      actionLabel: "Revisar conteúdo",
      actionHref: editarHref("perfil"),
    };
  }
  return null;
}
