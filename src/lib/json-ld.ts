/** Serializa JSON-LD para dentro de <script>, escapando "<" para o conteúdo nunca fechar a tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
