import { auth } from "@/auth";
import { requireAdmin, requireOwnBusiness } from "@/lib/auth-guards";
import { getBusinessById } from "@/lib/services/platform";
import { landingCapabilitiesFor, type LandingCapabilities } from "./sections.ts";
import type { Business } from "@/data/businesses";

/** Papéis de admin que podem editar a landing de qualquer empresa (super_admin sempre passa). */
const ADMIN_EDITORS = ["admin", "comercial", "marketing", "conteudo"] as const;

export type LandingTarget = {
  businessId: string;
  business: Business;
  capabilities: LandingCapabilities;
  /** id do admin quando a edição vem do painel administrativo; null quando é a própria empresa */
  adminId: string | null;
};

/**
 * Descobre QUAL empresa está sendo editada e quem edita. Com `adminBusinessId`, exige um admin autorizado;
 * sem ele, a empresa vem sempre da sessão (nunca de um parâmetro do cliente), então uma empresa só edita a si mesma.
 */
export async function resolveLandingTarget(adminBusinessId?: string): Promise<LandingTarget> {
  const adminId = adminBusinessId ? await requireAdmin([...ADMIN_EDITORS]) : null;
  const businessId = adminBusinessId ?? (await requireOwnBusiness());

  const business = await getBusinessById(businessId);
  if (!business) throw new Error("Empresa não encontrada.");
  return { businessId, business, capabilities: landingCapabilitiesFor(business.effectivePlan), adminId };
}

/** Para páginas (Server Components): quem está logado e como. */
export async function currentEditor(): Promise<{ kind: "business"; businessId: string } | { kind: "admin" } | null> {
  const session = await auth();
  if (session?.user?.role === "admin") return { kind: "admin" };
  return session?.user?.businessId ? { kind: "business", businessId: session.user.businessId } : null;
}
