/** Diagnóstico de uma imagem da biblioteca: para quais usos o tamanho serve (puro). */
export type MediaKind = "logo" | "foto" | "video" | "banner" | "story" | "documento";

export const MEDIA_KIND_LABEL: Record<MediaKind, string> = {
  logo: "Logo",
  foto: "Foto",
  video: "Vídeo",
  banner: "Banner",
  story: "Arte de Stories",
  documento: "Documento",
};

type Use = { name: string; ratio: number; minWidth: number };

/** Usos conhecidos: proporção desejada e largura mínima recomendada. */
const USES: Use[] = [
  { name: "Stories", ratio: 1080 / 1920, minWidth: 1080 },
  { name: "banner largo", ratio: 1200 / 240, minWidth: 1200 },
  { name: "capa de matéria e newsletter", ratio: 16 / 9, minWidth: 1200 },
  { name: "galeria de fotos", ratio: 4 / 3, minWidth: 1200 },
];
const RATIO_TOLERANCE = 0.06;
const MIN_USABLE_WIDTH = 600;

export type MediaVerdict = { fits: string[]; tooSmall: boolean; message: string };

export function assessImage(width: number, height: number): MediaVerdict {
  if (!width || !height) return { fits: [], tooSmall: false, message: "Não foi possível ler as dimensões." };
  const ratio = width / height;
  const fits = USES.filter((use) => Math.abs(ratio - use.ratio) / use.ratio <= RATIO_TOLERANCE && width >= use.minWidth * 0.95).map((use) => use.name);
  const tooSmall = width < MIN_USABLE_WIDTH;
  if (tooSmall) return { fits, tooSmall, message: "Esta arte está abaixo da resolução recomendada." };
  if (fits.length > 0) return { fits, tooSmall, message: `Esta imagem possui o tamanho correto para ${fits.join(" e ")}.` };
  return { fits, tooSmall, message: `Tamanho ${width}×${height}px: serve para uso geral, mas não tem a proporção de Stories, banner ou matéria.` };
}
