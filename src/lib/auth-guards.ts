import { auth } from "@/auth";

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

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
  return session.user.id;
}
