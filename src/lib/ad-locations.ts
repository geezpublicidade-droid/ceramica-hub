/** Esboço de página para mostrar, no painel, ONDE cada espaço de anúncio aparece. Coordenadas em % (viewBox 100x100). */
export type WireBlock = { id: string; x: number; y: number; w: number; h: number; label?: string };
export type Wireframe = { title: string; blocks: WireBlock[] };

const header: WireBlock = { id: "header", x: 0, y: 0, w: 100, h: 7, label: "Menu" };
const footer: WireBlock = { id: "footer", x: 0, y: 92, w: 100, h: 8, label: "Rodapé" };

const WIREFRAMES: Record<string, Wireframe> = {
  home: {
    title: "Home",
    blocks: [
      header,
      { id: "hero_capa", x: 0, y: 8, w: 76, h: 38, label: "Capa" },
      { id: "hero_lateral", x: 77, y: 8, w: 23, h: 38, label: "Painel" },
      { id: "cats", x: 0, y: 48, w: 100, h: 10, label: "Categorias" },
      { id: "featured", x: 0, y: 60, w: 100, h: 14, label: "Negócios em destaque" },
      { id: "logos", x: 0, y: 76, w: 100, h: 7, label: "Marcas parceiras" },
      { id: "news", x: 0, y: 85, w: 100, h: 6, label: "Eventos e notícias" },
      footer,
    ],
  },
  empresas: {
    title: "Lista de empresas",
    blocks: [
      header,
      { id: "search", x: 0, y: 9, w: 100, h: 8, label: "Busca e filtros" },
      { id: "row1", x: 0, y: 19, w: 100, h: 16, label: "Empresas" },
      { id: "empresas_meio", x: 0, y: 37, w: 100, h: 12, label: "Faixa" },
      { id: "row2", x: 0, y: 51, w: 100, h: 16, label: "Empresas" },
      { id: "empresas_rodape", x: 0, y: 74, w: 100, h: 14, label: "Faixa" },
      footer,
    ],
  },
  pagina: {
    title: "Página interna",
    blocks: [
      header,
      { id: "title", x: 0, y: 9, w: 100, h: 12, label: "Título" },
      { id: "content", x: 0, y: 23, w: 100, h: 46, label: "Conteúdo" },
      { id: "rodape", x: 0, y: 74, w: 100, h: 14, label: "Faixa" },
      footer,
    ],
  },
};

const PAGE_FOR_KEY: Record<string, { wireframe: keyof typeof WIREFRAMES; block: string }> = {
  hero_capa: { wireframe: "home", block: "hero_capa" },
  hero_lateral: { wireframe: "home", block: "hero_lateral" },
  empresas_meio: { wireframe: "empresas", block: "empresas_meio" },
  empresas_rodape: { wireframe: "empresas", block: "empresas_rodape" },
};

/** Esboço + bloco destacado do espaço; chaves sem esboço próprio (busca, blog, torres...) usam a página interna com faixa no rodapé. */
export function locationFor(key: string): { wireframe: Wireframe; highlight: string } {
  const known = PAGE_FOR_KEY[key];
  if (known) return { wireframe: WIREFRAMES[known.wireframe], highlight: known.block };
  return { wireframe: WIREFRAMES.pagina, highlight: "rodape" };
}
