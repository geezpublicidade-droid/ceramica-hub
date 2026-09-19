/**
 * Ids âncora compartilhados entre DashboardNav, EditPageManager, dashboard/page.tsx
 * e presence-score.ts. Mudar um valor aqui atualiza nav, seção de destino e
 * recomendações juntos, em vez de exigir editar a mesma string em 4 arquivos.
 */
export const EDITAR_ANCHOR = {
  perfil: "perfil",
  servicos: "servicos",
  fotos: "fotos",
  promocoes: "promocoes",
} as const;

export const DASHBOARD_ANCHOR = {
  resultados: "resultados",
  plano: "plano",
  privacidade: "privacidade",
} as const;

export const editarHref = (anchor: keyof typeof EDITAR_ANCHOR) =>
  `/dashboard/editar#${EDITAR_ANCHOR[anchor]}`;

export const dashboardHref = (anchor: keyof typeof DASHBOARD_ANCHOR) =>
  `/dashboard#${DASHBOARD_ANCHOR[anchor]}`;
