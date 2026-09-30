import { createServiceClient } from "@/lib/supabase/server";
import { sendEmailDetailed } from "@/lib/services/email";
import { getAudienceById, previewAudience } from "@/lib/services/marketing-audiences";

export type EmailKind =
  | "newsletter"
  | "promocional"
  | "comunicado"
  | "convite_evento"
  | "boas_vindas"
  | "renovacao"
  | "reativacao"
  | "divulgacao_empresa";

export const EMAIL_KIND_LABEL: Record<EmailKind, string> = {
  newsletter: "Newsletter",
  promocional: "Campanha promocional",
  comunicado: "Comunicado",
  convite_evento: "Convite para evento",
  boas_vindas: "Boas-vindas",
  renovacao: "Renovação de plano",
  reativacao: "Reativação de cliente",
  divulgacao_empresa: "Divulgação de empresa",
};

export type EmailTemplate = { id: string; name: string; kind: EmailKind; subject: string; bodyHtml: string };

export type CampaignStatus = "rascunho" | "enviando" | "enviada";

export type CampaignStats = {
  enviados: number;
  entregues: number;
  aberturas: number;
  cliques: number;
  erros: number;
  descadastros: number;
  leads: number;
};

export type EmailCampaign = {
  id: string;
  name: string;
  kind: EmailKind;
  subject: string;
  bodyHtml: string;
  audienceId: string | null;
  audienceName: string | null;
  status: CampaignStatus;
  sentAt: string | null;
  createdAt: string;
  stats: CampaignStats;
};

const SEND_CONCURRENCY = 5;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function unsubscribeUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/descadastrar/${token}`;
}

/** Substitui {{nome}} pelo nome (escapado) e acrescenta o rodapé de
 * descadastro obrigatório em todo disparo. */
export function renderCampaignHtml(bodyHtml: string, recipient: { name: string; unsubscribeToken: string }): string {
  const personalized = bodyHtml.replace(/\{\{\s*nome\s*\}\}/gi, escapeHtml(recipient.name));
  const link = unsubscribeUrl(recipient.unsubscribeToken);
  return `${personalized}
<hr style="margin:32px 0 16px;border:none;border-top:1px solid #e5e0d8" />
<p style="font-size:12px;color:#7a746c;line-height:1.5">
  Você recebeu este e-mail porque aceitou receber comunicados do Cerâmica Hub.
  <a href="${link}" style="color:#b76546">Cancelar inscrição</a>.
</p>`;
}

// ── Templates ────────────────────────────────────────────────────────────

type TemplateRow = { id: string; name: string; kind: EmailKind; subject: string; body_html: string };

function mapTemplate(row: TemplateRow): EmailTemplate {
  return { id: row.id, name: row.name, kind: row.kind, subject: row.subject, bodyHtml: row.body_html };
}

export async function getAllTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await createServiceClient()
    .from("email_templates")
    .select("id, name, kind, subject, body_html")
    .order("name");
  if (error) throw error;
  return ((data ?? []) as TemplateRow[]).map(mapTemplate);
}

export async function createTemplate(
  input: { name: string; kind: EmailKind; subject: string; bodyHtml: string },
  adminId: string,
): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("email_templates")
    .insert({ name: input.name.trim(), kind: input.kind, subject: input.subject.trim(), body_html: input.bodyHtml, created_by: adminId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await createServiceClient().from("email_templates").delete().eq("id", id);
  if (error) throw error;
}

// ── Campanhas ────────────────────────────────────────────────────────────

type CampaignRow = {
  id: string;
  name: string;
  kind: EmailKind;
  subject: string;
  body_html: string;
  audience_id: string | null;
  status: CampaignStatus;
  sent_at: string | null;
  created_at: string;
  marketing_audiences: { name: string } | null;
};

type SendStatsRow = {
  campaign_id: string;
  status: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  unsubscribed_at: string | null;
};

function computeStats(sends: SendStatsRow[], leads: number): CampaignStats {
  return {
    enviados: sends.filter((send) => send.status === "sent").length,
    entregues: sends.filter((send) => send.delivered_at).length,
    aberturas: sends.filter((send) => send.opened_at).length,
    cliques: sends.filter((send) => send.clicked_at).length,
    erros: sends.filter((send) => send.status === "failed").length,
    descadastros: sends.filter((send) => send.unsubscribed_at).length,
    leads,
  };
}

export async function getAllCampaigns(): Promise<EmailCampaign[]> {
  const supabase = createServiceClient();
  const [campaignsResult, sendsResult, leadsResult] = await Promise.all([
    supabase
      .from("email_campaigns")
      .select("id, name, kind, subject, body_html, audience_id, status, sent_at, created_at, marketing_audiences(name)")
      .order("created_at", { ascending: false }),
    supabase.from("email_sends").select("campaign_id, status, delivered_at, opened_at, clicked_at, unsubscribed_at"),
    supabase.from("leads").select("email_campaign_id").not("email_campaign_id", "is", null),
  ]);
  if (campaignsResult.error) throw campaignsResult.error;
  if (sendsResult.error) throw sendsResult.error;
  if (leadsResult.error) throw leadsResult.error;

  const sends = (sendsResult.data ?? []) as SendStatsRow[];
  const leads = leadsResult.data ?? [];

  return ((campaignsResult.data ?? []) as unknown as CampaignRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    subject: row.subject,
    bodyHtml: row.body_html,
    audienceId: row.audience_id,
    audienceName: row.marketing_audiences?.name ?? null,
    status: row.status,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    stats: computeStats(
      sends.filter((send) => send.campaign_id === row.id),
      leads.filter((lead) => lead.email_campaign_id === row.id).length,
    ),
  }));
}

export async function createCampaign(
  input: { name: string; kind: EmailKind; subject: string; bodyHtml: string; audienceId: string },
  adminId: string,
): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("email_campaigns")
    .insert({
      name: input.name.trim(),
      kind: input.kind,
      subject: input.subject.trim(),
      body_html: input.bodyHtml,
      audience_id: input.audienceId,
      created_by: adminId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteDraftCampaign(id: string): Promise<void> {
  const { error } = await createServiceClient().from("email_campaigns").delete().eq("id", id).eq("status", "rascunho");
  if (error) throw error;
}

type SendRow = { id: string; email: string; business_id: string | null; unsubscribe_token: string };

async function deliverOne(campaign: { subject: string; body_html: string }, send: SendRow, name: string): Promise<void> {
  const supabase = createServiceClient();
  const result = await sendEmailDetailed({
    to: send.email,
    subject: campaign.subject,
    html: renderCampaignHtml(campaign.body_html, { name, unsubscribeToken: send.unsubscribe_token }),
    headers: { "List-Unsubscribe": `<${unsubscribeUrl(send.unsubscribe_token)}>` },
  });
  const patch = result.ok
    ? { status: "sent", provider_id: result.providerId, sent_at: new Date().toISOString() }
    : { status: "failed", error: result.error };
  const { error } = await supabase.from("email_sends").update(patch).eq("id", send.id);
  if (error) throw error;
}

export type SendCampaignResult = { recipients: number; sent: number; failed: number };

/** Dispara a campanha para o público (só quem tem consentimento ativo e não
 * se descadastrou). A troca rascunho -> enviando é atômica: dois cliques
 * simultâneos não geram envio duplicado. */
export async function sendCampaign(campaignId: string): Promise<SendCampaignResult> {
  const supabase = createServiceClient();

  const { data: claimed, error: claimError } = await supabase
    .from("email_campaigns")
    .update({ status: "enviando" })
    .eq("id", campaignId)
    .eq("status", "rascunho")
    .select("id, subject, body_html, audience_id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) throw new Error("Esta campanha já foi enviada ou não existe.");

  try {
    const audience = claimed.audience_id ? await getAudienceById(claimed.audience_id) : null;
    if (!audience) throw new Error("A campanha não tem um público válido.");
    const { recipients } = await previewAudience(audience.filters);

    const { data: inserted, error: insertError } = await supabase
      .from("email_sends")
      .insert(recipients.map((recipient) => ({ campaign_id: campaignId, business_id: recipient.businessId, email: recipient.email })))
      .select("id, email, business_id, unsubscribe_token");
    if (insertError) throw insertError;

    const nameByEmail = new Map(recipients.map((recipient) => [recipient.email, recipient.name]));
    const queue = [...((inserted ?? []) as SendRow[])];
    let failed = 0;

    async function worker() {
      for (let send = queue.shift(); send; send = queue.shift()) {
        try {
          await deliverOne(claimed!, send, nameByEmail.get(send.email) ?? "");
        } catch (error) {
          failed += 1;
          console.error("[email-marketing] falha ao registrar envio:", error);
        }
      }
    }
    await Promise.all(Array.from({ length: SEND_CONCURRENCY }, worker));

    await supabase.from("email_campaigns").update({ status: "enviada", sent_at: new Date().toISOString() }).eq("id", campaignId);
    const stats = await getCampaignSendCounts(campaignId);
    return { recipients: recipients.length, sent: stats.sent, failed: stats.failed + failed };
  } catch (error) {
    // Volta pra rascunho só se nada foi enviado; senão fica "enviando" pra revisão manual.
    const { count } = await supabase.from("email_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
    if (!count) await supabase.from("email_campaigns").update({ status: "rascunho" }).eq("id", campaignId);
    throw error;
  }
}

async function getCampaignSendCounts(campaignId: string): Promise<{ sent: number; failed: number }> {
  const { data, error } = await createServiceClient().from("email_sends").select("status").eq("campaign_id", campaignId);
  if (error) throw error;
  const rows = data ?? [];
  return { sent: rows.filter((row) => row.status === "sent").length, failed: rows.filter((row) => row.status === "failed").length };
}

// ── Descadastro e consentimento (LGPD) ───────────────────────────────────

export type UnsubscribeOutcome = { found: true; email: string } | { found: false };

/** Descadastra pelo token do disparo: entra na lista de supressão e o
 * consentimento é revogado. Idempotente. */
export async function unsubscribeByToken(token: string): Promise<UnsubscribeOutcome> {
  const supabase = createServiceClient();
  const { data: send, error } = await supabase
    .from("email_sends")
    .select("id, email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!send) return { found: false };

  const now = new Date().toISOString();
  const email = send.email.toLowerCase();
  const results = await Promise.all([
    supabase.from("email_unsubscribes").upsert({ email, reason: "link_no_email" }),
    supabase.from("email_consents").update({ revoked_at: now }).eq("email", email),
    supabase.from("email_sends").update({ unsubscribed_at: now }).eq("id", send.id).is("unsubscribed_at", null),
  ]);
  const failure = results.find((result) => result.error);
  if (failure?.error) throw failure.error;
  return { found: true, email };
}

/** Consentimento registrado pelo admin (ex: autorização dada por escrito). */
export async function grantConsent(businessId: string, note: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: business, error } = await supabase.from("businesses").select("email").eq("id", businessId).single();
  if (error) throw error;
  const email = business.email.toLowerCase();

  const results = await Promise.all([
    supabase.from("email_consents").upsert({
      email,
      business_id: businessId,
      source: "admin",
      note: note.trim() || null,
      granted_at: new Date().toISOString(),
      revoked_at: null,
    }),
    // Consentimento novo e explícito substitui um descadastro anterior.
    supabase.from("email_unsubscribes").delete().eq("email", email),
  ]);
  const failure = results.find((result) => result.error);
  if (failure?.error) throw failure.error;
}

export async function getConsentSummary(): Promise<{ approvedBusinesses: number; withConsent: number; unsubscribed: number }> {
  const supabase = createServiceClient();
  const [businesses, consents, unsubscribes] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("email_consents").select("email", { count: "exact", head: true }).is("revoked_at", null),
    supabase.from("email_unsubscribes").select("email", { count: "exact", head: true }),
  ]);
  for (const result of [businesses, consents, unsubscribes]) if (result.error) throw result.error;
  return { approvedBusinesses: businesses.count ?? 0, withConsent: consents.count ?? 0, unsubscribed: unsubscribes.count ?? 0 };
}

// ── Eventos do provedor (webhook) ────────────────────────────────────────

const PROVIDER_EVENT_COLUMN: Record<string, "delivered_at" | "opened_at" | "clicked_at"> = {
  "email.delivered": "delivered_at",
  "email.opened": "opened_at",
  "email.clicked": "clicked_at",
};

/** Aplica um evento do Resend ao envio correspondente. Só grava a primeira
 * ocorrência de cada tipo (a métrica é "quantos abriram", não "quantas vezes"). */
export async function applyProviderEvent(type: string, providerId: string): Promise<void> {
  const supabase = createServiceClient();
  const column = PROVIDER_EVENT_COLUMN[type];
  if (column) {
    const { error } = await supabase
      .from("email_sends")
      .update({ [column]: new Date().toISOString() })
      .eq("provider_id", providerId)
      .is(column, null);
    if (error) throw error;
    return;
  }
  if (type === "email.bounced" || type === "email.complained") {
    const { error } = await supabase
      .from("email_sends")
      .update({ status: "failed", error: type === "email.bounced" ? "Rejeitado (bounce)." : "Marcado como spam." })
      .eq("provider_id", providerId);
    if (error) throw error;
  }
}
