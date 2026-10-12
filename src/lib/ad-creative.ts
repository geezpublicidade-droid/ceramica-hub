/** Validação pura do criativo contra a medida do espaço (usada no navegador e no servidor). */
export type CreativeTarget = { width: number; height: number };

const RATIO_TOLERANCE = 0.06;
const MIN_WIDTH_SHARE = 0.7;

export const CREATIVE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_CREATIVE_BYTES = 4 * 1024 * 1024;

/** Mensagem do problema, ou null se a arte serve: mesma proporção do espaço (±6%) e largura de pelo menos 70% da medida. */
export function checkCreativeSize(width: number, height: number, target: CreativeTarget): string | null {
  if (!width || !height) return "Não foi possível ler as dimensões da imagem.";
  const wantedRatio = target.width / target.height;
  const ratio = width / height;
  if (Math.abs(ratio - wantedRatio) / wantedRatio > RATIO_TOLERANCE) {
    return `Proporção incorreta: a arte tem ${width}×${height}px e este espaço pede ${target.width}×${target.height}px.`;
  }
  if (width < target.width * MIN_WIDTH_SHARE) {
    return `Resolução baixa: a arte tem ${width}px de largura; o recomendado é ${target.width}px.`;
  }
  return null;
}
