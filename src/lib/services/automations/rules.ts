import { createServiceClient } from "@/lib/supabase/server";
import { getContractsExpiringSoon } from "@/lib/services/anchors";
import { getMonthlyReport, previousMonthKey, formatMonthLabel } from "@/lib/services/business-results";
import { absoluteUrl, escapeHtml, renderAutomationEmail } from "./email-layout";
import type { AutomationKey } from "./registry";
import type { AutomationJob } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

type BusinessRow = { id: string; name: string; email: string };
type Body = { subject: string; html: string };

const MARKETING_ADMIN_ROLES = ["super_admin", "admin", "marketing"];
const SALES_ADMIN_ROLES = ["super_admin", "admin", "comercial"];

async function adminEmails(roles: string[]): Promise<string[]> {
  const { data, error } = await createServiceClient().from("admins").select("email").in("role", roles);
  if (error) throw error;
  return (data ?? []).map((row) => row.email);
}

/** Um job por empresa: monta o e-mail com o nome dela e (opcional) um botão. */
function businessJob(
  automation: AutomationKey,
  dedupeKey: string,
  business: BusinessRow,
  compose: (token: string | null) => Promise<Body> | Body
): AutomationJob {
  return { automation, dedupeKey, to: business.email, businessId: business.id, build: async (token) => compose(token) };
}

/** Um job por admin destinatário, todos com o mesmo conteúdo. */
function adminJobs(automation: AutomationKey, dedupeKey: string, recipients: string[], body: Body): AutomationJob[] {
  return recipients.map((to) => ({ automation, dedupeKey, to, build: async () => body }));
}

async function selectBusinesses(configure: (query: ReturnType<typeof baseBusinessQuery>) => ReturnType<typeof baseBusinessQuery>): Promise<BusinessRow[]> {
  const { data, error } = await configure(baseBusinessQuery());
  if (error) throw error;
  return (data ?? []) as BusinessRow[];
}

function baseBusinessQuery() {
  return createServiceClient().from("businesses").select("id, name, email");
}

// ── Empresas ─────────────────────────────────────────────────────────────

async function welcomeJobs(): Promise<AutomationJob[]> {
  const businesses = await selectBusinesses((q) => q.eq("status", "approved").gte("created_at", daysFromNow(-14).toISOString()));
  return businesses.map((business) =>
    businessJob("welcome", business.id, business, (token) => ({
      subject: "Bem-vindo ao Cerâmica Hub!",
      html: renderAutomationEmail({
        title: `Olá, ${business.name}!`,
        bodyHtml: "<p>Sua empresa já está no ar no Cerâmica Hub. Complete sua página com fotos, serviços e promoções para aparecer melhor nas buscas e receber mais contatos.</p>",
        cta: { label: "Abrir meu painel", href: absoluteUrl("/dashboard") },
        unsubscribeToken: token,
      }),
    }))
  );
}

async function incompleteProfileJobs(): Promise<AutomationJob[]> {
  const businesses = await selectBusinesses((q) =>
    q
      .in("status", ["approved", "pending"])
      .lte("created_at", daysFromNow(-3).toISOString())
      .gte("created_at", daysFromNow(-30).toISOString())
      .or("logo_url.is.null,description.is.null,description.eq.")
  );
  return businesses.map((business) =>
    businessJob("incomplete_profile", business.id, business, (token) => ({
      subject: "Falta pouco para sua página ficar completa",
      html: renderAutomationEmail({
        title: `${business.name}, sua página está quase lá`,
        bodyHtml: "<p>Notamos que o seu perfil ainda está sem logo ou descrição. Páginas completas aparecem melhor no diretório e passam mais confiança a quem visita.</p>",
        cta: { label: "Completar minha página", href: absoluteUrl("/dashboard/editar") },
        unsubscribeToken: token,
      }),
    }))
  );
}

async function monthlyReportJobs(): Promise<AutomationJob[]> {
  // Janela de 5 dias: se o envio do dia 1 falhar, os dias seguintes tentam de novo.
  if (new Date().getUTCDate() > 5) return [];
  const month = previousMonthKey();
  const businesses = await selectBusinesses((q) => q.eq("status", "approved").neq("plan", "presenca"));
  return businesses.map((business) =>
    businessJob("monthly_report", `${business.id}:${month}`, business, async (token) => {
      const { results } = await getMonthlyReport(business.id, month);
      const { views, leads } = results.totals;
      return {
        subject: `Seu resumo de ${formatMonthLabel(month)} no Cerâmica Hub`,
        html: renderAutomationEmail({
          title: `Resumo de ${formatMonthLabel(month)}`,
          bodyHtml: `<p>${escapeHtml(business.name)} teve <strong>${views}</strong> visualizações da página e <strong>${leads}</strong> contatos gerados no mês.</p>`,
          cta: { label: "Ver relatório completo", href: absoluteUrl(`/dashboard/resultados/relatorio?mes=${month}`) },
          unsubscribeToken: token,
        }),
      };
    })
  );
}

async function renewalBusinessJobs(): Promise<AutomationJob[]> {
  const supabase = createServiceClient();
  const [subs, trials] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, ends_at, businesses(id, name, email)")
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .lte("ends_at", daysFromNow(15).toISOString()),
    supabase
      .from("businesses")
      .select("id, name, email, trial_ends_at")
      .eq("trial_status", "active")
      .gte("trial_ends_at", new Date().toISOString())
      .lte("trial_ends_at", daysFromNow(3).toISOString()),
  ]);
  if (subs.error) throw subs.error;
  if (trials.error) throw trials.error;

  const planJobs = (subs.data ?? []).flatMap((sub) => {
    const business = sub.businesses as unknown as BusinessRow | null;
    if (!business) return [];
    return [
      businessJob("renewal", `sub:${sub.id}:${isoDate(new Date(sub.ends_at))}`, business, (token) => renewalEmail(business.name, "Seu plano vence em breve", "Renove para manter seus recursos e resultados ativos.", token)),
    ];
  });
  const trialJobs = (trials.data ?? []).map((business) =>
    businessJob("renewal", `trial:${business.id}:${isoDate(new Date(business.trial_ends_at))}`, business, (token) => renewalEmail(business.name, "Seu teste gratuito está acabando", "Escolha um plano para continuar com os recursos do teste.", token))
  );
  return [...planJobs, ...trialJobs];
}

function renewalEmail(name: string, subject: string, message: string, token: string | null): Body {
  return {
    subject,
    html: renderAutomationEmail({
      title: `${name}: ${subject.toLowerCase()}`,
      bodyHtml: `<p>${message}</p>`,
      cta: { label: "Ver planos", href: absoluteUrl("/dashboard#plano") },
      unsubscribeToken: token,
    }),
  };
}

async function anchorRenewalJobs(): Promise<AutomationJob[]> {
  const [contracts, recipients] = await Promise.all([getContractsExpiringSoon(30), adminEmails(SALES_ADMIN_ROLES)]);
  return contracts.flatMap((contract) =>
    adminJobs("renewal", `anchor:${contract.id}`, recipients, {
      subject: `Contrato de âncora vencendo: ${contract.partnerName}`,
      html: renderAutomationEmail({
        title: "Contrato de âncora perto do fim",
        bodyHtml: `<p>O contrato de <strong>${escapeHtml(contract.partnerName)}</strong> termina em ${contract.endsOn.split("-").reverse().join("/")}. Hora de conversar sobre a renovação.</p>`,
        cta: { label: "Abrir parceiro", href: absoluteUrl(`/admin/parceiros/${contract.partnerId}`) },
      }),
    })
  );
}

async function reactivationJobs(): Promise<AutomationJob[]> {
  const from = daysFromNow(-60).toISOString();
  const to = daysFromNow(-7).toISOString();
  const businesses = await selectBusinesses((q) =>
    q.eq("status", "approved").eq("plan", "presenca").eq("trial_status", "expired").gte("trial_ends_at", from).lte("trial_ends_at", to)
  );
  const quarter = `${new Date().getUTCFullYear()}-Q${Math.floor(new Date().getUTCMonth() / 3) + 1}`;
  return businesses.map((business) =>
    businessJob("reactivation", `${business.id}:${quarter}`, business, (token) => ({
      subject: "Sentimos sua falta no Cerâmica Hub",
      html: renderAutomationEmail({
        title: `${business.name}, que tal voltar a crescer com a gente?`,
        bodyHtml: "<p>Seu teste gratuito terminou, mas seus dados continuam salvos. Escolha um plano para retomar destaque, resultados e relatórios.</p>",
        cta: { label: "Ver planos", href: absoluteUrl("/dashboard#plano") },
        unsubscribeToken: token,
      }),
    }))
  );
}

// ── Equipe ───────────────────────────────────────────────────────────────

async function approvalRequestJobs(): Promise<AutomationJob[]> {
  const supabase = createServiceClient();
  const [content, campaigns, recipients] = await Promise.all([
    supabase.from("content_items").select("id", { count: "exact", head: true }).eq("status", "aguardando_aprovacao"),
    supabase.from("marketing_campaigns").select("id", { count: "exact", head: true }).eq("status", "aguardando_aprovacao"),
    adminEmails(MARKETING_ADMIN_ROLES),
  ]);
  if (content.error) throw content.error;
  if (campaigns.error) throw campaigns.error;
  const total = (content.count ?? 0) + (campaigns.count ?? 0);
  if (total === 0) return [];

  return adminJobs("approval_request", `digest:${isoDate(new Date())}`, recipients, {
    subject: `${total} item(ns) aguardando aprovação`,
    html: renderAutomationEmail({
      title: "Aprovações pendentes",
      bodyHtml: `<p>${content.count ?? 0} conteúdo(s) e ${campaigns.count ?? 0} campanha(s) aguardam aprovação na Central de Marketing.</p>`,
      cta: { label: "Abrir Central de Marketing", href: absoluteUrl("/admin/marketing") },
    }),
  });
}

async function publicationReminderJobs(): Promise<AutomationJob[]> {
  const supabase = createServiceClient();
  const [items, fallback] = await Promise.all([
    supabase
      .from("content_items")
      .select("id, title, scheduled_for, admins:owner_admin_id(email)")
      .in("status", ["aprovado", "agendado"])
      .gte("scheduled_for", isoDate(new Date()))
      .lte("scheduled_for", isoDate(daysFromNow(1))),
    adminEmails(MARKETING_ADMIN_ROLES),
  ]);
  if (items.error) throw items.error;

  return (items.data ?? []).flatMap((item) => {
    const owner = (item.admins as unknown as { email: string } | null)?.email;
    return adminJobs("publication_reminder", `content:${item.id}:${item.scheduled_for}`, owner ? [owner] : fallback, {
      subject: `Publicação marcada: ${item.title}`,
      html: renderAutomationEmail({
        title: "Lembrete de publicação",
        bodyHtml: `<p><strong>${escapeHtml(item.title)}</strong> está marcado para ${item.scheduled_for.split("-").reverse().join("/")}.</p>`,
        cta: { label: "Abrir calendário", href: absoluteUrl("/admin/marketing/calendario") },
      }),
    });
  });
}

async function campaignEndedJobs(): Promise<AutomationJob[]> {
  const supabase = createServiceClient();
  const [campaigns, fallback] = await Promise.all([
    supabase
      .from("marketing_campaigns")
      .select("id, name, ends_on, admins:owner_admin_id(email)")
      .eq("status", "ativa")
      .lt("ends_on", isoDate(new Date()))
      .gte("ends_on", isoDate(daysFromNow(-30))),
    adminEmails(MARKETING_ADMIN_ROLES),
  ]);
  if (campaigns.error) throw campaigns.error;

  return (campaigns.data ?? []).flatMap((campaign) => {
    const owner = (campaign.admins as unknown as { email: string } | null)?.email;
    return (owner ? [owner] : fallback).map<AutomationJob>((to) => ({
      automation: "campaign_ended",
      dedupeKey: `campaign:${campaign.id}`,
      to,
      build: async () => {
        // Encerra de fato só depois de reservar o aviso, pra rodar uma vez por campanha.
        await supabase.from("marketing_campaigns").update({ status: "encerrada" }).eq("id", campaign.id).eq("status", "ativa");
        return {
          subject: `Campanha encerrada: ${campaign.name}`,
          html: renderAutomationEmail({
            title: "Campanha encerrada",
            bodyHtml: `<p>A campanha <strong>${escapeHtml(campaign.name)}</strong> chegou ao fim. Veja os resultados e registre os números finais.</p>`,
            cta: { label: "Ver resultados", href: absoluteUrl(`/admin/marketing/campanhas/${campaign.id}`) },
          }),
        };
      },
    }));
  });
}

async function newLeadJobs(): Promise<AutomationJob[]> {
  const supabase = createServiceClient();
  const since = daysFromNow(-3).toISOString();
  const [leads, partnerLeads, recipients] = await Promise.all([
    supabase.from("leads").select("id, contact_name, company_name, source").gte("created_at", since),
    supabase.from("partner_leads").select("id, contact_name, business_name").gte("created_at", since),
    adminEmails(SALES_ADMIN_ROLES),
  ]);
  if (leads.error) throw leads.error;
  if (partnerLeads.error) throw partnerLeads.error;

  const entries = [
    ...(leads.data ?? []).map((lead) => ({ key: `lead:${lead.id}`, who: lead.company_name || lead.contact_name, href: "/admin/leads" })),
    ...(partnerLeads.data ?? []).map((lead) => ({ key: `partner_lead:${lead.id}`, who: lead.business_name, href: "/admin/leads" })),
  ];
  return entries.flatMap((entry) =>
    adminJobs("new_lead", entry.key, recipients, {
      subject: `Novo lead: ${entry.who}`,
      html: renderAutomationEmail({
        title: "Novo lead",
        bodyHtml: `<p>Chegou um novo lead: <strong>${escapeHtml(entry.who)}</strong>.</p>`,
        cta: { label: "Abrir leads", href: absoluteUrl(entry.href) },
      }),
    })
  );
}

const COLLECTORS: Record<AutomationKey, () => Promise<AutomationJob[]>> = {
  welcome: welcomeJobs,
  incomplete_profile: incompleteProfileJobs,
  approval_request: approvalRequestJobs,
  publication_reminder: publicationReminderJobs,
  monthly_report: monthlyReportJobs,
  campaign_ended: campaignEndedJobs,
  renewal: async () => (await Promise.all([renewalBusinessJobs(), anchorRenewalJobs()])).flat(),
  reactivation: reactivationJobs,
  new_lead: newLeadJobs,
};

export function collectJobs(automation: AutomationKey): Promise<AutomationJob[]> {
  return COLLECTORS[automation]();
}
