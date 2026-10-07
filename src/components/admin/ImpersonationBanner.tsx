import { auth } from "@/auth";
import { stopImpersonationAction } from "@/lib/actions/impersonation";

/** Faixa fixa no painel da empresa quando o super_admin está "entrando como" ela. */
export async function ImpersonationBanner() {
  const session = await auth();
  if (!session?.user.impersonatedBy) return null;

  return (
    <form action={stopImpersonationAction} className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-foreground px-4 py-2 text-[14px] text-background">
      <span>Você está dentro do painel desta empresa como administrador (Geez). Tudo o que fizer vale de verdade e fica na auditoria.</span>
      <button type="submit" className="tap rounded-full bg-background px-4 py-1 text-[14px] font-medium text-foreground">
        Sair e voltar ao admin
      </button>
    </form>
  );
}
