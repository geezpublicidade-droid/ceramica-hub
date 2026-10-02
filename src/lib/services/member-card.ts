/** Código curto e estável da carteirinha: primeiros 8 caracteres do id do membro, em maiúsculas. */
export function memberCardCode(memberId: string): string {
  return memberId.replace(/-/g, "").slice(0, 8).toUpperCase();
}
