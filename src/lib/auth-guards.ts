import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AdminRole } from "@/auth";

// Pra onde mandar cada papel quando ele tenta acessar uma área fora do seu
// escopo — precisa ser sempre um destino que o próprio papel pode acessar,
// senão vira loop de redirect.
const DEFAULT_ADMIN_PATH_BY_ROLE: Record<AdminRole, string> = {
  super_admin: "/admin",
  admin: "/admin",
  moderador: "/admin",
  financeiro: "/admin/financeiro",
  comercial: "/admin/publicidade",
};

/**
 * DECISÃO ARQUITETURAL — por que não há RLS "de verdade" no Postgres:
 *
 * Todo acesso ao banco (ver createServiceClient() em src/lib/supabase/server.ts)
 * usa a service-role key, que ignora RLS completamente. As policies
 * "deny-all" nas migrations existem mas são inertes na prática. Isolamento
 * entre empresas hoje é garantido 100% aqui na aplicação: toda mutação
 * deriva o businessId/adminId da sessão via requireOwnBusiness()/requireAdmin()
 * (nunca de um parâmetro vindo do cliente), e toda operação sobre um recurso
 * específico (serviço, foto, promoção, fatura, etc.) filtra também por
 * `business_id = <businessId da sessão>` — isso é o que evita um tenant
 * ler/alterar recurso de outro adivinhando um UUID (IDOR). Auditado
 * manualmente em 26/07/2026 (todas as actions em src/lib/actions/*.ts +
 * leituras públicas em platform.ts) — nenhum furo encontrado.
 *
 * RLS de verdade exigiria o Postgres saber quem está logado a cada query,
 * o que na prática significa migrar login (empresa/membro/admin) pro
 * Supabase Auth nativo — troca a fundação de autenticação inteira. Decisão
 * consciente de adiar essa migração até o produto ter volume/risco que
 * justifique, em vez de arriscar a autenticação de um MVP recém-lançado.
 * Quando for revisitar: Supabase Auth também traria MFA nativo (poderia
 * substituir o TOTP custom em src/auth.ts).
 */

export async function requireOwnBusiness(): Promise<string> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) throw new Error("Não autenticado.");
  return businessId;
}

/**
 * Igual requireOwnBusiness(), mas rejeita business_staff — usa em ações que
 * só o dono pode fazer (cobrança, gerenciar a própria equipe, excluir a
 * conta). Staff nunca deriva permissão maior que o próprio owner, então
 * qualquer coisa que precise ser mais restrita que "toda a empresa" passa
 * por aqui.
 */
export async function requireBusinessOwner(): Promise<string> {
  const session = await auth();
  if (!session?.user?.businessId || session.user.isStaff) {
    throw new Error("Ação restrita ao responsável pela empresa.");
  }
  return session.user.businessId;
}

/**
 * Sem `allowedRoles`, qualquer admin passa (comportamento original).
 * Com `allowedRoles`, exige um desses papéis — `super_admin` sempre passa,
 * mesmo se não estiver na lista, porque é o papel de acesso total.
 */
export async function requireAdmin(allowedRoles?: AdminRole[]): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
  const adminRole = session.user.adminRole ?? "admin";
  if (allowedRoles && adminRole !== "super_admin" && !allowedRoles.includes(adminRole)) {
    throw new Error("Seu papel de administrador não tem acesso a esta área.");
  }
  return session.user.id;
}

/** Versão pra Server Component: redireciona em vez de lançar erro. */
export async function requireAdminPage(allowedRoles?: AdminRole[]): Promise<{ adminId: string; adminRole: AdminRole }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/login");
  }
  const adminRole = session.user.adminRole ?? "admin";
  if (allowedRoles && adminRole !== "super_admin" && !allowedRoles.includes(adminRole)) {
    redirect(DEFAULT_ADMIN_PATH_BY_ROLE[adminRole]);
  }
  return { adminId: session.user.id, adminRole };
}
