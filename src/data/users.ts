export type PlatformUser = {
  id: string;
  email: string;
  /** hash bcrypt — nunca guardar senha em texto puro, nem em dado de demonstração */
  passwordHash: string;
  /** liga a conta à empresa que ela administra em businesses.ts */
  businessId: string;
};

/**
 * Contas de demonstração pro login/dashboard. Enquanto não existe banco de
 * dados real (plano é trocar por Supabase — ver src/lib/services/platform.ts),
 * este arquivo faz o papel de "tabela de usuários". Todas as contas abaixo
 * usam a mesma senha de demonstração: ceramica2026
 */
export const users: PlatformUser[] = [
  {
    id: "user-geez",
    email: "geez@ceramicahub.com.br",
    passwordHash: "$2b$10$ONsD0ZHsd8DoZfT/3o21neC4vsve4q2TaLhtAlPaBeQ6QJrlCboGe",
    businessId: "geez-publicidade",
  },
  {
    id: "user-conta-certa",
    email: "contacerta@ceramicahub.com.br",
    passwordHash: "$2b$10$ONsD0ZHsd8DoZfT/3o21neC4vsve4q2TaLhtAlPaBeQ6QJrlCboGe",
    businessId: "conta-certa",
  },
  {
    id: "user-espaco-derme",
    email: "derme@ceramicahub.com.br",
    passwordHash: "$2b$10$ONsD0ZHsd8DoZfT/3o21neC4vsve4q2TaLhtAlPaBeQ6QJrlCboGe",
    businessId: "espaco-derme",
  },
];

export async function findUserByEmail(email: string): Promise<PlatformUser | undefined> {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}
