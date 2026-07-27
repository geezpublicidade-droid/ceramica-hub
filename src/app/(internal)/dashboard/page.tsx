import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getBusinessById, getMetricsSummary, getOwnedInvoices, getDailyPageViews } from "@/lib/services/platform";
import { listStaff } from "@/lib/actions/business-staff";
import { planLabels } from "@/data/businesses";
import { PlanBilling } from "@/components/dashboard/PlanBilling";
import { PrivacyControls } from "@/components/dashboard/PrivacyControls";
import { StaffManagement } from "@/components/dashboard/StaffManagement";
import { SignOutButton } from "@/components/nav/SignOutButton";

export const metadata = { title: "Painel — Cerâmica Hub" };

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function DashboardPage() {
  const session = await auth();
  const isOwner = session?.user?.role === "business";
  const business = session?.user?.businessId
    ? await getBusinessById(session.user.businessId)
    : undefined;
  const metrics = session?.user?.businessId
    ? await getMetricsSummary(session.user.businessId)
    : undefined;
  const invoices = session?.user?.businessId ? await getOwnedInvoices(session.user.businessId) : [];
  const staff = isOwner ? await listStaff() : [];

  const totalViews = metrics?.commercial_page_viewed ?? 0;
  const totalContacts =
    (metrics?.whatsapp_clicked ?? 0) + (metrics?.appointment_clicked ?? 0);
  const hasDetailedMetrics = business?.effectivePlan !== "presenca";
  const dailyViews =
    hasDetailedMetrics && session?.user?.businessId ? await getDailyPageViews(session.user.businessId, 7) : [];

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] text-muted">Painel da empresa</p>
            <h1 className="text-2xl font-semibold text-foreground">
              {business?.name ?? "Empresa não encontrada"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/editar"
              className="neu-primary rounded-full px-6 py-3 text-[16px] font-semibold text-white"
            >
              Editar página
            </Link>
            <SignOutButton action={logout} />
          </div>
        </div>

        {business?.trial.status === "active" && business.trial.endsAt && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
            <p className="text-[16px] font-medium text-foreground">
              Você está no teste gratuito do plano {business.trial.plan}.
            </p>
            <p className="mt-1 text-[15px] text-muted">
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
            <p className="text-[16px] font-medium text-foreground">
              Seu teste gratuito do plano Destaque terminou.
            </p>
            <p className="mt-1 text-[15px] text-muted">
              Sua página voltou pro plano gratuito. Seus dados continuam salvos — faça upgrade
              quando quiser recuperar os recursos do plano Destaque.
            </p>
          </div>
        )}

        {business ? (
          <>
            <div className="glass-light grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
              <div>
                <p className="text-[14px] text-muted">Plano</p>
                <p className="text-[16px] text-foreground">{planLabels[business.effectivePlan]}</p>
              </div>
              <div>
                <p className="text-[14px] text-muted">Categoria</p>
                <p className="text-[16px] text-foreground">{business.category}</p>
              </div>
              <div>
                <p className="text-[14px] text-muted">Andar</p>
                <p className="text-[16px] text-foreground">{business.floor}</p>
              </div>
              <div>
                <p className="text-[14px] text-muted">Instagram</p>
                <p className="text-[16px] text-foreground">{business.instagram}</p>
              </div>
              <div>
                <p className="text-[14px] text-muted">WhatsApp</p>
                <p className="text-[16px] text-foreground">{business.phone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[14px] text-muted">Descrição</p>
                <p className="text-[16px] text-foreground">{business.description}</p>
              </div>
            </div>

            <div className="glass-light rounded-3xl p-6">
              <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">
                Métricas
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-semibold text-foreground">{totalViews}</p>
                  <p className="mt-1 text-[15px] text-muted">Visualizações da página</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-foreground">{totalContacts}</p>
                  <p className="mt-1 text-[15px] text-muted">Contatos recebidos</p>
                </div>
              </div>
              {!hasDetailedMetrics && (
                <p className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-[15px] text-foreground">
                  Sua página recebeu interesse. Faça upgrade para visualizar a origem das
                  buscas, períodos e serviços mais acessados.
                </p>
              )}
              {hasDetailedMetrics && dailyViews.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-[14px] text-muted">Visualizações por dia (últimos 7 dias)</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {dailyViews.map((row) => (
                      <div key={row.day} className="flex items-center justify-between text-[15px]">
                        <span className="text-muted">
                          {new Date(row.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </span>
                        <span className="font-medium text-foreground">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isOwner && <PlanBilling currentPlan={business.plan} invoices={invoices} />}
            {isOwner && <StaffManagement staff={staff} />}
            <PrivacyControls isOwner={isOwner} />
          </>
        ) : null}
      </div>
    </main>
  );
}
