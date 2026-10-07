import Link from "next/link";
import { auth, signOut } from "@/auth";
import {
  getBusinessById,
  getMetricsSummary,
  getDailyPageViews,
  getBusinessServices,
  getBusinessPhotos,
  getOwnedPromotions,
} from "@/lib/services/platform";
import { listStaff } from "@/lib/actions/business-staff";
import { planLabels } from "@/data/businesses";
import { calculatePresenceScore, getNextStepRecommendation } from "@/lib/services/presence-score";
import { DASHBOARD_ANCHOR } from "@/lib/dashboard-anchors";
import { PrivacyControls } from "@/components/dashboard/PrivacyControls";
import { StaffManagement } from "@/components/dashboard/StaffManagement";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { StatusPill, type StatusPillTone } from "@/components/dashboard/StatusPill";
import { PresenceScoreCard } from "@/components/dashboard/PresenceScoreCard";
import { NextStepCard } from "@/components/dashboard/NextStepCard";
import { ChannelsCard } from "@/components/dashboard/ChannelsCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { landingCapabilitiesFromFeatures } from "@/lib/landing/sections";
import { DailyViewsChart } from "@/components/dashboard/DailyViewsChart";
import { LivePreviewCard } from "@/components/dashboard/LivePreviewCard";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = { title: "Painel — Cerâmica Hub" };

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

const PROFILE_STATUS: Record<string, { label: string; tone: StatusPillTone }> = {
  approved: { label: "Online", tone: "positive" },
  pending: { label: "Em análise", tone: "pending" },
  rejected: { label: "Inativo", tone: "neutral" },
  suspended: { label: "Inativo", tone: "neutral" },
};

export default async function DashboardPage() {
  const session = await auth();
  const isOwner = session?.user?.role === "business";
  const businessId = session?.user?.businessId;

  const [business, metrics, staff, services, photos, promotions, dailyViewsRaw, permissions] =
    await Promise.all([
      businessId ? getBusinessById(businessId) : Promise.resolve(undefined),
      businessId ? getMetricsSummary(businessId) : Promise.resolve(undefined),
      isOwner ? listStaff() : Promise.resolve([]),
      businessId ? getBusinessServices(businessId) : Promise.resolve([]),
      businessId ? getBusinessPhotos(businessId) : Promise.resolve([]),
      businessId ? getOwnedPromotions(businessId) : Promise.resolve([]),
      businessId ? getDailyPageViews(businessId, 7) : Promise.resolve([]),
      businessId ? getCompanyPermissions(businessId) : Promise.resolve(null),
    ]);

  const totalViews = metrics?.commercial_page_viewed ?? 0;
  const totalContacts = (metrics?.whatsapp_clicked ?? 0) + (metrics?.appointment_clicked ?? 0);
  // métricas por plano: nenhuma (gratuito), só visualizações (resumo), básicas ou completas
  const metricsLevel = permissions ? landingCapabilitiesFromFeatures(permissions.features).metrics : "none";
  const hasDetailedMetrics = metricsLevel !== "none" && metricsLevel !== "summary";
  const dailyViews = hasDetailedMetrics ? dailyViewsRaw : [];

  const hasActivePromotion = promotions.some((promotion) => promotion.active);
  const presenceInput = business
    ? { business, serviceCount: services.length, photoCount: photos.length, hasActivePromotion }
    : undefined;
  const score = presenceInput ? calculatePresenceScore(presenceInput) : undefined;
  const nextStep = presenceInput ? getNextStepRecommendation(presenceInput) : null;
  const status = business ? PROFILE_STATUS[business.status] : undefined;

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {business && (
              <BusinessAvatar
                business={business}
                className="h-14 w-14 rounded-full bg-white shadow-[0_4px_16px_-6px_rgba(0,0,0,0.2)]"
                textClassName="text-[18px] font-semibold text-foreground"
              />
            )}
            <div className="min-w-0">
              <p className="text-[15px] text-muted">Painel da empresa</p>
              <h1 className="truncate text-2xl font-semibold text-foreground">
                {business?.name ?? "Empresa não encontrada"}
              </h1>
            </div>
          </div>
          <SignOutButton action={logout} />
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

        {business && score && status ? (
          <>
            {/* Hero — "Marketing em movimento" */}
            <div className="glass-light rounded-3xl p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={status.label} tone={status.tone} />
                <span className="text-[13px] text-muted">
                  Atualizado em{" "}
                  {new Date(business.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="mt-4 text-[26px] font-semibold tracking-tight text-foreground">
                Seu marketing está em movimento.
              </h2>
              <p className="mt-2 text-[16px] leading-relaxed text-muted">
                Acompanhe sua presença no Cerâmica Hub, veja onde sua empresa está aparecendo e
                descubra o próximo passo para fortalecer seu perfil.
              </p>

              <div className="mt-6 border-t border-border pt-6">
                <PresenceScoreCard score={score} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {business.status === "approved" ? (
                  <Link
                    href={`/empresa/${business.slug}`}
                    target="_blank"
                    className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground"
                  >
                    Ver perfil publicado
                  </Link>
                ) : (
                  <span
                    title="Disponível depois que seu cadastro for aprovado"
                    className="neu cursor-not-allowed rounded-full px-6 py-3 text-[15px] font-medium text-muted"
                  >
                    Ver perfil publicado
                  </span>
                )}
                <Link
                  href="/dashboard/editar"
                  className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white"
                >
                  Editar conteúdo
                </Link>
              </div>
            </div>

            {/* Resultados (detalhe por período em /dashboard/resultados) */}
            <div id={DASHBOARD_ANCHOR.resultados} className="glass-light scroll-mt-24 rounded-3xl p-6">
              <div className="flex items-baseline justify-between">
                <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">
                  Resultados
                </p>
                <Link href="/dashboard/resultados" className="text-[14px] font-medium text-primary hover:underline">Ver detalhes: 7, 30 e 90 dias</Link>
              </div>
              {metricsLevel === "none" ? (
                <div className="mt-4">
                  <UpgradePrompt feature="metrics_summary" label="Métricas da página" description="Acompanhe visualizações e contatos da sua empresa." />
                </div>
              ) : (
                <div className={`mt-4 grid gap-4 ${hasDetailedMetrics ? "grid-cols-2" : "grid-cols-1"}`}>
                  <StatTile label="Visualizações da página" value={totalViews} />
                  {hasDetailedMetrics && <StatTile label="Contatos recebidos" value={totalContacts} />}
                </div>
              )}
              {metricsLevel === "summary" && (
                <p className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-[15px] text-foreground">
                  Faça upgrade para visualizar contatos, cliques em promoções, uso de cupons, origem das visitas e períodos.
                </p>
              )}
              {hasDetailedMetrics && dailyViews.length > 0 && (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="mb-4 text-[14px] text-muted">Visualizações por dia (últimos 7 dias)</p>
                  <DailyViewsChart data={dailyViews} />
                </div>
              )}
              {metricsLevel !== "none" && totalViews === 0 && totalContacts === 0 && (
                <p className="mt-5 text-[15px] text-muted">
                  Seu perfil acabou de entrar no ar. As primeiras métricas aparecerão assim que
                  ele começar a ser exibido.
                </p>
              )}
            </div>

            <NextStepCard recommendation={nextStep} />

            <ChannelsCard business={business} hasActivePromotion={hasActivePromotion} features={permissions?.features ?? null} />

            <LivePreviewCard business={business} photos={photos} />

            {/* Resumo cadastral */}
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
                {business.instagram ? (
                  <a
                    href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    className="text-[16px] font-medium text-primary hover:underline"
                  >
                    {business.instagram}
                  </a>
                ) : (
                  <p className="text-[16px] text-muted">Não informado</p>
                )}
              </div>
              <div>
                <p className="text-[14px] text-muted">WhatsApp</p>
                <a
                  href={buildWhatsAppLink(business.phone, business.name)}
                  target="_blank"
                  className="text-[16px] font-medium text-primary hover:underline"
                >
                  {business.phone}
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[14px] text-muted">Descrição</p>
                <p className="text-[16px] text-foreground">{business.description}</p>
              </div>
            </div>

            <div className="glass-light flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
              <div>
                <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">QR Code</p>
                <p className="mt-2 max-w-md text-[15px] text-muted">
                  Baixe o QR Code da sua página pra usar em placas, cartões ou material impresso da sua empresa.
                </p>
              </div>
              <a
                href={`/api/business/${business.slug}/qrcode`}
                className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground"
              >
                Baixar QR Code
              </a>
            </div>

            {isOwner && (
              <div id={DASHBOARD_ANCHOR.plano} className="scroll-mt-24 glass-light flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
                <div>
                  <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Plano e assinatura</p>
                  <p className="mt-2 text-[16px] text-foreground">
                    {planLabels[business.effectivePlan]}
                    {business.planInGrace ? " — pagamento em atraso" : business.planStatus !== "active" ? ` — ${business.planStatus === "pending" ? "aguardando pagamento" : business.planStatus}` : ""}
                  </p>
                  <p className="mt-1 text-[14px] text-muted">Recursos, limites, renovação, upgrade e histórico.</p>
                </div>
                <Link href="/dashboard/plano" className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
                  Gerenciar plano
                </Link>
              </div>
            )}
            {isOwner && <StaffManagement staff={staff} />}
            <div id={DASHBOARD_ANCHOR.privacidade} className="scroll-mt-24">
              <PrivacyControls isOwner={isOwner} />
            </div>
          </>
        ) : null}
        </div>
      </div>
    </main>
  );
}
