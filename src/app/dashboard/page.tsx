import { auth, signOut } from "@/auth";
import { getBusinessById, getMetricsSummary } from "@/lib/services/platform";
import { planLabels } from "@/data/businesses";

export const metadata = { title: "Painel — Cerâmica Hub" };

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function DashboardPage() {
  const session = await auth();
  const business = session?.user?.businessId
    ? await getBusinessById(session.user.businessId)
    : undefined;
  const metrics = session?.user?.businessId
    ? await getMetricsSummary(session.user.businessId)
    : undefined;

  const totalViews = metrics?.commercial_page_viewed ?? 0;
  const totalContacts =
    (metrics?.whatsapp_clicked ?? 0) + (metrics?.appointment_clicked ?? 0);
  const hasDetailedMetrics = business?.effectivePlan !== "presenca";

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-muted">Painel da empresa</p>
            <h1 className="text-2xl font-semibold text-foreground">
              {business?.name ?? "Empresa não encontrada"}
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground"
            >
              Sair
            </button>
          </form>
        </div>

        {business?.trial.status === "active" && business.trial.endsAt && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
            <p className="text-[14px] font-medium text-foreground">
              Você está no teste gratuito do plano {business.trial.plan}.
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Válido até{" "}
              {new Date(business.trial.endsAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              . Depois disso, sua página volta automaticamente pro plano gratuito — nada é
              cobrado sem você escolher fazer upgrade.
            </p>
          </div>
        )}

        {business?.trial.status === "expired" && (
          <div className="rounded-2xl border border-border bg-white/60 px-5 py-4">
            <p className="text-[14px] font-medium text-foreground">
              Seu teste gratuito do plano Destaque terminou.
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Sua página voltou pro plano gratuito. Seus dados continuam salvos — faça upgrade
              quando quiser recuperar os recursos do plano Destaque.
            </p>
          </div>
        )}

        {business ? (
          <>
            <div className="glass-light grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
              <div>
                <p className="text-[12px] text-muted">Plano</p>
                <p className="text-[14px] text-foreground">{planLabels[business.effectivePlan]}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Categoria</p>
                <p className="text-[14px] text-foreground">{business.category}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Andar</p>
                <p className="text-[14px] text-foreground">{business.floor}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Instagram</p>
                <p className="text-[14px] text-foreground">{business.instagram}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted">WhatsApp</p>
                <p className="text-[14px] text-foreground">{business.phone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[12px] text-muted">Descrição</p>
                <p className="text-[14px] text-foreground">{business.description}</p>
              </div>
            </div>

            <div className="glass-light rounded-3xl p-6">
              <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">
                Métricas
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{totalViews}</p>
                  <p className="mt-1 text-[13px] text-muted">Visualizações da página</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-foreground">{totalContacts}</p>
                  <p className="mt-1 text-[13px] text-muted">Contatos recebidos</p>
                </div>
              </div>
              {!hasDetailedMetrics && (
                <p className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-[13px] text-foreground">
                  Sua página recebeu interesse. Faça upgrade para visualizar a origem das
                  buscas, períodos e serviços mais acessados.
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
