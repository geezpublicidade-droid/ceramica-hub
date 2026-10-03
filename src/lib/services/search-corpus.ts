import { categoryBreadcrumb, categoryPath, getCategoryTree, getBusinessCategoryLinks, type CategoryTree } from "@/lib/services/categories";
import { loadFacets, profileCompleteness } from "@/lib/services/company-discovery";
import { getAllBusinesses } from "@/lib/services/platform";
import type { CategoryTerm, TowerTerm } from "@/lib/search-intent";

export type CorpusCompany = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  /** nomes + sinônimos das categorias da empresa */
  categoryForms: string[];
  /** categoria mais específica, para mostrar na sugestão */
  categoryLabel: string;
  /** ids das categorias a que a empresa pertence (qualquer nível) */
  linkIds: Set<string>;
  towerId: string | null;
  towerName: string | null;
  floor: string | null;
  verified: boolean;
  online: boolean;
  inPerson: boolean;
  logo?: string;
  completeness: number;
};

export type SearchCorpus = {
  tree: CategoryTree;
  categories: CategoryTerm[];
  towers: TowerTerm[];
  floors: string[];
  companies: CorpusCompany[];
};

const TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; corpus: Promise<SearchCorpus> }>();

async function buildCorpus(locale: string): Promise<SearchCorpus> {
  const [tree, links, businesses, { facets, towers }] = await Promise.all([
    getCategoryTree(locale),
    getBusinessCategoryLinks(),
    getAllBusinesses(locale),
    loadFacets(),
  ]);
  const towerNames = new Map(towers.map((tower) => [tower.id, tower.name]));

  const categories: CategoryTerm[] = [...tree.byId.values()].map((category) => ({
    id: category.id,
    level: category.level,
    path: categoryPath(tree, category),
    label: categoryBreadcrumb(tree, category),
    forms: [category.name, ...category.keywords],
  }));

  const companies: CorpusCompany[] = businesses.map((business) => {
    const facet = facets.get(business.id);
    const linkIds = links.get(business.id) ?? new Set<string>();
    const linked = [...linkIds].flatMap((id) => {
      const category = tree.byId.get(id);
      return category ? [category] : [];
    });
    const deepest = [...linked].sort((a, b) => b.level - a.level)[0];
    return {
      id: business.id,
      slug: business.slug,
      name: business.name,
      description: business.description,
      tags: facet?.tags ?? [],
      categoryForms: linked.flatMap((category) => [category.name, ...category.keywords]),
      categoryLabel: deepest?.name ?? business.category,
      linkIds,
      towerId: facet?.tower_id ?? null,
      towerName: facet ? (towerNames.get(facet.tower_id) ?? null) : null,
      floor: facet?.floor ?? null,
      verified: business.verified,
      online: facet?.serves_online ?? false,
      inPerson: facet?.serves_in_person ?? true,
      logo: business.logo,
      completeness: profileCompleteness(business),
    };
  });

  return {
    tree,
    categories,
    towers: towers.map((tower) => ({ id: tower.id, name: tower.name })),
    floors: [...new Set(companies.flatMap((company) => (company.floor ? [company.floor] : [])))].sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true }),
    ),
    companies,
  };
}

/**
 * Base da pesquisa inteligente (categorias com sinônimos, empresas, torres), guardada em memória por
 * 60 s: cada tecla digitada consulta isto, e o diretório muda devagar. Falha não fica em cache.
 */
export function getSearchCorpus(locale: string): Promise<SearchCorpus> {
  const hit = cache.get(locale);
  if (hit && hit.expiresAt > Date.now()) return hit.corpus;
  const corpus = buildCorpus(locale);
  cache.set(locale, { expiresAt: Date.now() + TTL_MS, corpus });
  corpus.catch(() => cache.delete(locale));
  return corpus;
}
