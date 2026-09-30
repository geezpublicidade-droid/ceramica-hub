/** Formatos de espaço publicitário (Fase 3.8). Constantes puras, seguras pra client components. */
export const AD_PLACEMENT_FORMATS = ["banner", "carrossel", "logo", "video", "texto", "pagina_dedicada", "outro"] as const;
export type AdPlacementFormat = (typeof AD_PLACEMENT_FORMATS)[number];

export const AD_PLACEMENT_FORMAT_LABEL: Record<AdPlacementFormat, string> = {
  banner: "Banner",
  carrossel: "Carrossel",
  logo: "Logo",
  video: "Vídeo",
  texto: "Texto / destaque",
  pagina_dedicada: "Página dedicada",
  outro: "Outro",
};
