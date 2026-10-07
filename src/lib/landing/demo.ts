import type { Business } from "@/data/businesses";
import type { LandingConfig, LandingData, LandingFaq, LandingOffer } from "@/lib/services/landing";
import type { BusinessReview } from "@/lib/services/reviews";
import type { OwnedPhoto } from "@/lib/services/platform";
import { parseSchedule } from "./hours.ts";

/** Imagens do próprio Hub usadas quando a empresa não tem fotos (repetir é esperado numa simulação). */
export const DEMO_STOCK_IMAGES = [
  "/images/ceramica-hub-corporativo.webp",
  "/images/ceramica-hub-hero.webp",
  "/images/ceramica-hub-eventos.webp",
  "/images/ceramica-hub-gastronomia.webp",
];

type Family = "saude" | "tecnologia" | "alimentacao" | "profissional" | "educacao" | "generico";

type DemoText = {
  headline: string;
  subtitle: string;
  problem: string;
  benefit: string;
  audience: string;
  differentials: string[];
  services: { name: string; description: string; price: number | null; duration: string | null }[];
  faqs: { question: string; answer: string }[];
  offer: { title: string; description: string };
  reviews: { name: string; rating: number; comment: string }[];
  finalTitle: string;
  finalText: string;
};

const FAMILY_KEYWORDS: [Family, RegExp][] = [
  ["saude", /sa[úu]de|est[ée]tic|beleza|laborat|odonto|cl[íi]nic/i],
  ["tecnologia", /tecnolog|marketing|design|arquitet/i],
  ["alimentacao", /aliment|gastron|restaur|caf[ée]|padaria/i],
  ["profissional", /contab|jur[íi]d|direito|invest/i],
  ["educacao", /educa/i],
];

export function familyFor(category: string): Family {
  return FAMILY_KEYWORDS.find(([, pattern]) => pattern.test(category))?.[0] ?? "generico";
}

const COMMON_FAQS = [
  { question: "Como faço para entrar em contato?", answer: "Pelo botão de WhatsApp desta página ou pelo formulário. Respondemos o mais rápido possível no horário de atendimento." },
  { question: "Onde vocês ficam?", answer: "No Espaço Cerâmica, em São Caetano do Sul. A torre, o andar e a sala estão na seção de localização, com o botão “Como chegar”." },
  { question: "Quais formas de pagamento são aceitas?", answer: "Cartões de crédito e débito, Pix e dinheiro. Condições especiais podem ser combinadas no atendimento." },
  { question: "Existe estacionamento?", answer: "Sim, com acesso facilitado para quem vem de carro. Os detalhes estão na seção de localização." },
];

const TEXTS: Record<Family, DemoText> = {
  saude: {
    headline: "Cuidado completo com tecnologia e confiança.",
    subtitle: "Atendimento personalizado, profissionais experientes e um ambiente pensado para você, no coração do Espaço Cerâmica.",
    problem: "Quem busca cuidado de qualidade precisa de um plano claro, não de promessas vagas.",
    benefit: "Avaliação individual e acompanhamento próximo em cada etapa do tratamento.",
    audience: "Pessoas que valorizam atendimento humanizado e resultados naturais.",
    differentials: ["Equipe experiente e atualizada", "Tecnologia de ponta", "Atendimento com hora marcada", "Ambiente acolhedor"],
    services: [
      { name: "Avaliação inicial", description: "Conversa e diagnóstico para montar o plano ideal para você.", price: 120, duration: "40 min" },
      { name: "Tratamento personalizado", description: "Protocolo desenhado conforme a sua necessidade e rotina.", price: 280, duration: "60 min" },
      { name: "Procedimento avançado", description: "Tecnologia moderna com segurança e conforto.", price: 450, duration: "90 min" },
      { name: "Manutenção e retorno", description: "Acompanhamento para manter os resultados ao longo do tempo.", price: 180, duration: "45 min" },
      { name: "Pacote completo", description: "Combinação de sessões com condição especial.", price: 890, duration: null },
      { name: "Atendimento prioritário", description: "Horários reservados para quem precisa de mais agilidade.", price: null, duration: null },
    ],
    faqs: [{ question: "A avaliação tem custo?", answer: "A avaliação inicial tem condição especial para quem chega pelo Cerâmica Hub." }, ...COMMON_FAQS],
    offer: { title: "Avaliação inicial com condição especial.", description: "Exclusivo para usuários do Cerâmica Hub." },
    reviews: [
      { name: "Mariana A.", rating: 5, comment: "Atendimento excelente! Equipe atenciosa e um ambiente super moderno. Me senti muito segura durante todo o tratamento." },
      { name: "Carlos M.", rating: 5, comment: "Profissionais de alto nível, estrutura impecável e atendimento humanizado. Recomendo de olhos fechados!" },
      { name: "Fernanda L.", rating: 5, comment: "Pontualidade, cuidado e explicações claras. Voltarei com certeza." },
    ],
    finalTitle: "Pronto para cuidar de você?",
    finalText: "Fale agora com a nossa equipe e agende sua avaliação.",
  },
  tecnologia: {
    headline: "Estratégia, criatividade e tecnologia para o seu negócio crescer.",
    subtitle: "Sites, marketing e soluções digitais feitos sob medida para empresas locais, com acompanhamento de perto.",
    problem: "Muitos negócios locais têm bons produtos, mas pouca presença digital e nenhuma forma de medir resultado.",
    benefit: "Uma operação digital completa: do site à campanha, com métricas claras.",
    audience: "Clínicas, salões, lojas e empresas que querem atrair mais clientes na região.",
    differentials: ["Atendimento próximo, no mesmo prédio", "Projetos sob medida", "Relatórios simples e objetivos", "Entrega com prazo combinado"],
    services: [
      { name: "Sites e landing pages", description: "Páginas rápidas, bonitas e pensadas para gerar contatos.", price: null, duration: null },
      { name: "Gestão de redes sociais", description: "Planejamento, criação e publicação de conteúdo.", price: null, duration: null },
      { name: "Tráfego pago", description: "Campanhas no Google e Meta com foco em resultado.", price: null, duration: null },
      { name: "Identidade visual", description: "Marca, logotipo e materiais que passam confiança.", price: null, duration: null },
      { name: "Fotos e vídeos", description: "Produção de conteúdo profissional para sua empresa.", price: null, duration: null },
      { name: "Consultoria digital", description: "Diagnóstico e plano de ação para a sua presença online.", price: null, duration: "1 reunião" },
    ],
    faqs: [{ question: "Quanto tempo leva um projeto?", answer: "Depende do escopo. Combinamos prazo e entregas na proposta, antes de começar." }, ...COMMON_FAQS],
    offer: { title: "Diagnóstico digital sem custo.", description: "Reunião para entender seu momento e indicar o melhor caminho." },
    reviews: [
      { name: "Patrícia S.", rating: 5, comment: "Equipe ágil e criativa. O novo site já trouxe contatos logo na primeira semana." },
      { name: "Ricardo T.", rating: 5, comment: "Comunicação clara e entregas no prazo. Ótimo ter uma agência por perto." },
    ],
    finalTitle: "Vamos fazer sua empresa ser encontrada?",
    finalText: "Conte o que você precisa e receba um diagnóstico sem compromisso.",
  },
  alimentacao: {
    headline: "Sabor de verdade, bem pertinho de você.",
    subtitle: "Ingredientes selecionados, preparo caprichado e um ambiente para aproveitar com calma, no Espaço Cerâmica.",
    problem: "Falta de tempo não deveria significar comer mal.",
    benefit: "Comida de qualidade, servida rápido e com atendimento atencioso.",
    audience: "Quem trabalha, mora ou passa pelo Cerâmica e quer uma boa refeição.",
    differentials: ["Ingredientes frescos", "Opções para todos os gostos", "Atendimento ágil", "Ambiente confortável"],
    services: [
      { name: "Prato do dia", description: "Refeição completa com acompanhamentos.", price: 38, duration: null },
      { name: "Executivo", description: "Combinação rápida para o almoço.", price: 32, duration: null },
      { name: "Lanches e salgados", description: "Feitos na hora, com ingredientes selecionados.", price: 18, duration: null },
      { name: "Sobremesas", description: "Doces da casa para fechar bem.", price: 14, duration: null },
      { name: "Bebidas", description: "Sucos, cafés e opções geladas.", price: 9, duration: null },
      { name: "Encomendas", description: "Pedidos para reuniões e eventos.", price: null, duration: null },
    ],
    faqs: [{ question: "Vocês fazem entrega?", answer: "Fazemos entrega na região. Consulte pelo WhatsApp." }, ...COMMON_FAQS],
    offer: { title: "Café de cortesia no primeiro pedido.", description: "Válido para novos clientes que chegam pelo Cerâmica Hub." },
    reviews: [
      { name: "Juliana P.", rating: 5, comment: "Comida deliciosa e atendimento muito simpático. Virou meu almoço de toda semana." },
      { name: "André R.", rating: 4, comment: "Prático, saboroso e com preço justo. Recomendo." },
    ],
    finalTitle: "Bateu a fome?",
    finalText: "Peça pelo WhatsApp ou venha nos visitar.",
  },
  profissional: {
    headline: "Orientação clara para decisões importantes.",
    subtitle: "Atendimento especializado, linguagem simples e acompanhamento próximo para você e para a sua empresa.",
    problem: "Burocracia e dúvidas atrasam decisões que deveriam ser simples.",
    benefit: "Segurança para decidir, com um profissional que explica cada passo.",
    audience: "Pessoas e empresas que querem organização e tranquilidade.",
    differentials: ["Atendimento personalizado", "Linguagem clara", "Sigilo e ética profissional", "Acompanhamento contínuo"],
    services: [
      { name: "Consultoria inicial", description: "Entendemos o seu caso e indicamos o melhor caminho.", price: null, duration: "1 reunião" },
      { name: "Acompanhamento mensal", description: "Rotina organizada com relatórios claros.", price: null, duration: null },
      { name: "Regularização", description: "Ajustes e documentos em dia.", price: null, duration: null },
      { name: "Planejamento", description: "Estratégia para os próximos passos.", price: null, duration: null },
    ],
    faqs: [{ question: "A primeira conversa tem custo?", answer: "Oferecemos uma reunião inicial para entender o seu caso." }, ...COMMON_FAQS],
    offer: { title: "Reunião inicial com condição especial.", description: "Para quem chega pelo Cerâmica Hub." },
    reviews: [
      { name: "Marcos B.", rating: 5, comment: "Explicaram tudo com clareza e resolveram rápido. Atendimento muito profissional." },
      { name: "Lúcia C.", rating: 5, comment: "Me deram segurança em um momento importante. Recomendo." },
    ],
    finalTitle: "Vamos conversar sobre o seu caso?",
    finalText: "Fale com a nossa equipe e agende uma reunião.",
  },
  educacao: {
    headline: "Aprender com qualidade, perto de você.",
    subtitle: "Cursos e turmas com professores experientes, turmas reduzidas e acompanhamento individual.",
    problem: "Conciliar estudo e rotina exige flexibilidade e boa orientação.",
    benefit: "Turmas pequenas e atenção individual para cada aluno.",
    audience: "Estudantes e profissionais que querem evoluir no seu ritmo.",
    differentials: ["Professores experientes", "Turmas reduzidas", "Horários flexíveis", "Aula experimental"],
    services: [
      { name: "Curso regular", description: "Aulas semanais com material incluso.", price: 290, duration: "mensal" },
      { name: "Curso intensivo", description: "Conteúdo concentrado em menos tempo.", price: 480, duration: "mensal" },
      { name: "Aula particular", description: "Acompanhamento individual e flexível.", price: 120, duration: "60 min" },
      { name: "Turmas para empresas", description: "Treinamento sob medida para equipes.", price: null, duration: null },
    ],
    faqs: [{ question: "Posso fazer uma aula experimental?", answer: "Sim, consulte a disponibilidade pelo WhatsApp." }, ...COMMON_FAQS],
    offer: { title: "Aula experimental gratuita.", description: "Conheça a metodologia antes de se matricular." },
    reviews: [
      { name: "Camila F.", rating: 5, comment: "Professores atenciosos e conteúdo muito bem organizado." },
      { name: "Diego N.", rating: 5, comment: "Evoluí muito em poucos meses. Turma pequena faz diferença." },
    ],
    finalTitle: "Pronto para começar?",
    finalText: "Fale com a secretaria e conheça as turmas.",
  },
  generico: {
    headline: "Atendimento de confiança, pertinho de você.",
    subtitle: "Qualidade, transparência e proximidade para quem circula pelo Espaço Cerâmica.",
    problem: "Encontrar um bom fornecedor perto de casa ou do trabalho nem sempre é simples.",
    benefit: "Atendimento rápido, claro e feito sob medida.",
    audience: "Moradores, trabalhadores e empresas da região.",
    differentials: ["Atendimento personalizado", "Localização conveniente", "Transparência nos valores", "Equipe dedicada"],
    services: [
      { name: "Atendimento personalizado", description: "Entendemos a sua necessidade e indicamos a melhor solução.", price: null, duration: null },
      { name: "Serviço principal", description: "O que fazemos de melhor, com qualidade e prazo combinado.", price: null, duration: null },
      { name: "Plano completo", description: "Solução completa com condição especial.", price: null, duration: null },
      { name: "Suporte e acompanhamento", description: "Estamos por perto depois da entrega.", price: null, duration: null },
    ],
    faqs: COMMON_FAQS,
    offer: { title: "Condição especial para novos clientes.", description: "Exclusivo para quem chega pelo Cerâmica Hub." },
    reviews: [
      { name: "Paulo H.", rating: 5, comment: "Atendimento rápido e transparente. Resolveram tudo sem enrolação." },
      { name: "Renata G.", rating: 5, comment: "Equipe educada e eficiente. Voltarei sempre." },
    ],
    finalTitle: "Pronto para falar com a gente?",
    finalText: "Chame no WhatsApp e tire suas dúvidas.",
  },
};

/** Primeiro as imagens da própria empresa, repetidas em ciclo; sem nenhuma, usa as imagens do Hub. */
export function pickDemoImages(own: string[], count: number): string[] {
  const pool = own.length > 0 ? own : DEMO_STOCK_IMAGES;
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
}

export type DemoInput = {
  business: Business;
  /** imagens reais da empresa (capa e galeria), na ordem de preferência */
  ownImages: string[];
};

const DEMO_SCHEDULE = parseSchedule({
  mon: [["09:00", "18:00"]],
  tue: [["09:00", "18:00"]],
  wed: [["09:00", "18:00"]],
  thu: [["09:00", "18:00"]],
  fri: [["09:00", "18:00"]],
  sat: [["09:00", "13:00"]],
  sun: [],
});

function fillConfig(config: LandingConfig, text: DemoText, input: DemoInput, data: LandingData): LandingConfig {
  const { capabilities } = data;
  const own = input.ownImages[0];
  return {
    ...config,
    heroHeadline: config.heroHeadline ?? text.headline,
    heroSubtitle: config.heroSubtitle ?? text.subtitle,
    heroImageUrl: capabilities.customCover ? (config.heroImageUrl ?? own ?? DEMO_STOCK_IMAGES[0]) : config.heroImageUrl,
    aboutProblem: config.aboutProblem ?? text.problem,
    aboutBenefit: config.aboutBenefit ?? text.benefit,
    aboutAudience: config.aboutAudience ?? text.audience,
    aboutDifferentials: config.aboutDifferentials.length > 0 ? config.aboutDifferentials : text.differentials,
    yearsInBusiness: config.yearsInBusiness ?? 8,
    responseTime: config.responseTime ?? "Atendimento ágil pelo WhatsApp",
    parkingInfo: config.parkingInfo ?? "Conforto para sua visita",
    accessibilityInfo: config.accessibilityInfo ?? "Acesso por elevador e rampa",
    referencePoint: config.referencePoint ?? "Próximo à entrada principal",
    openingSchedule: config.openingSchedule ?? DEMO_SCHEDULE,
    leadFormEnabled: capabilities.leadForm ? true : config.leadFormEnabled,
    finalCtaTitle: config.finalCtaTitle ?? text.finalTitle,
    finalCtaText: config.finalCtaText ?? text.finalText,
  };
}

function demoServices(text: DemoText, input: DemoInput, max: number) {
  const images = pickDemoImages(input.ownImages, text.services.length);
  return text.services.slice(0, Number.isFinite(max) ? max : text.services.length).map((service, index) => ({
    id: `demo-service-${index + 1}`,
    businessId: input.business.id,
    name: service.name,
    description: service.description,
    photo: images[index],
    startingPrice: service.price,
    sortOrder: index,
    duration: service.duration,
    ctaLabel: null,
    active: true,
  }));
}

/** A grade de serviços de uma simulação nunca fica com menos de 4 cards: acrescenta exemplos (sem repetir nomes reais) até o limite do plano. */
const MIN_DEMO_SERVICES = 4;

function completeServices(real: LandingData["services"], text: DemoText, input: DemoInput, max: number): LandingData["services"] {
  if (max <= 0) return real;
  const goal = Math.min(Math.max(real.length, MIN_DEMO_SERVICES), Number.isFinite(max) ? max : text.services.length);
  if (real.length >= goal) return real;
  const taken = new Set(real.map((service) => service.name.toLowerCase()));
  const extra = demoServices(text, input, text.services.length).filter((service) => !taken.has(service.name.toLowerCase()));
  return [...real, ...extra.slice(0, goal - real.length)].map((service, index) => ({ ...service, sortOrder: index }));
}

function demoOffer(text: DemoText, input: DemoInput, withCoupon: boolean): LandingOffer {
  return {
    id: "demo-offer",
    title: text.offer.title,
    description: text.offer.description,
    imageUrl: pickDemoImages(input.ownImages, 2)[1],
    ctaLabel: null,
    couponCode: withCoupon ? "CERAMICA10" : null,
    validUntil: null,
  };
}

function demoGallery(input: DemoInput, count: number): OwnedPhoto[] {
  return pickDemoImages(input.ownImages, count).map((url, index) => ({
    id: `demo-photo-${index + 1}`,
    url,
    sortOrder: index,
    kind: "photo" as const,
    caption: null,
    alt: null,
  }));
}

function demoReviews(text: DemoText, input: DemoInput): BusinessReview[] {
  return text.reviews.map((review, index) => ({
    id: `demo-review-${index + 1}`,
    businessId: input.business.id,
    memberId: "demo",
    memberDisplayName: review.name,
    rating: review.rating,
    comment: review.comment,
    status: "aprovado" as const,
    createdAt: new Date(Date.now() - (index + 1) * 20 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

/**
 * Completa uma landing com conteúdo de EXEMPLO onde a empresa ainda não tem nada, respeitando os limites do plano
 * simulado (sem oferta, FAQ, galeria ou formulário onde o plano não inclui). Conteúdo real sempre prevalece.
 * Só para simulação/preview: nunca é gravado.
 */
export function applyDemoContent(data: LandingData, input: DemoInput): LandingData {
  const text = TEXTS[familyFor(input.business.category)];
  const { capabilities } = data;

  const faqs: LandingFaq[] = text.faqs.map((faq, index) => ({ id: `demo-faq-${index + 1}`, ...faq }));
  const services = completeServices(data.services, text, input, capabilities.maxServices);
  const gallery = data.gallery.length > 0 || !capabilities.gallery ? data.gallery : demoGallery(input, Math.min(capabilities.maxGalleryItems, 6));
  const reviews = data.reviews.length > 0 ? data.reviews : demoReviews(text, input);
  const offers = data.offers.length > 0 || !capabilities.offer ? data.offers : [demoOffer(text, input, capabilities.trackableCoupons)];

  return {
    ...data,
    config: fillConfig(data.config, text, input, data),
    services,
    hasMoreServices: services.length > 6,
    faqs: data.faqs.length > 0 || !capabilities.faq ? data.faqs : faqs,
    offers,
    offer: offers[0] ?? null,
    gallery,
    reviews,
    reviewStats: data.reviews.length > 0 ? data.reviewStats : { average: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length, count: reviews.length },
  };
}
