import { getAllProducts, type Product } from "@/lib/services/products";
import { formatCents } from "@/lib/utils";

/** Produtos que a empresa pode pedir no painel. Âncora nunca mostra preço
 * (proposta individual); planos têm tela própria e posições de categoria
 * são vendidas em /planos?categoria=. */
const OFFER_CATEGORIES = ["publicidade", "servico_adicional", "patrocinio", "pagina_especial"];
const HIDDEN_SLUGS = ["plano-ancora"];
const PROPOSAL_ONLY_SLUGS = ["ancora-fundadora"];

export type ProductOffer = { slug: string; name: string; description: string | null; priceLabel: string };

function priceLabel(product: Product): string | null {
  if (PROPOSAL_ONLY_SLUGS.includes(product.slug)) return "Sob proposta";
  const { monthlyPriceCents: monthly, yearlyPriceCents: yearly, billingType } = product;
  if (billingType === "unico" && monthly) return `${formatCents(monthly)} (pagamento único)`;
  if (monthly && yearly) return `${formatCents(monthly)}/mês ou ${formatCents(yearly)}/ano`;
  if (monthly) return `${formatCents(monthly)}/mês`;
  if (yearly) return `${formatCents(yearly)}/ano`;
  return null;
}

export async function getProductOffers(): Promise<ProductOffer[]> {
  const products = await getAllProducts({ onlyActive: true });
  return products
    .filter((p) => OFFER_CATEGORIES.includes(p.category) && !HIDDEN_SLUGS.includes(p.slug) && !p.slug.startsWith("categoria-"))
    .flatMap((p) => {
      const label = priceLabel(p);
      return label ? [{ slug: p.slug, name: p.name, description: p.description, priceLabel: label }] : [];
    });
}
