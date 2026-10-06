import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { getCompany360, type Company360 } from "@/lib/services/company-360";
import { getBusinessCategoryIds, getCategoryGroups } from "@/lib/services/business-categories";
import { setBusinessCategoriesAction } from "@/lib/actions/admin-category-placements";
import { BusinessCategoriesForm } from "@/components/admin/BusinessCategoriesForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompanyTabs } from "@/components/admin/CompanyTabs";
import { ContactRow } from "@/components/admin/ContactRow";
import { NewContactForm } from "@/components/admin/NewContactForm";
import { TaskRow } from "@/components/admin/TaskRow";

export const metadata = { title: "Empresa — Cerâmica Hub" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  suspended: "Suspensa",
};

const HISTORY_ACTION_LABEL: Record<string, string> = {
  approve_business: "Aprovação",
  reject_business: "Rejeição",
  set_business_founder: "Alteração de selo Fundadora",
  verify_business_address: "Confirmação de endereço",
  grant_trial: "Liberação de trial",
  suspend_business: "Suspensão",
  reactivate_business: "Reativação",
};

const FINANCE_ROLES: AdminRole[] = ["super_admin", "admin", "financeiro", "comercial"];

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border bg-white/40 p-6 text-center text-[14px] text-muted">{text}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted/70">{label}</p>
      <p className="text-[15px] text-foreground">{value}</p>
    </div>
  );
}

function renderOverview(data: Company360, categories: React.ReactNode) {
  const { profile, contacts, supportTickets, tasks } = data;
  const openTickets = supportTickets.filter((t) => t.status !== "fechado").length;
  const openTasks = tasks.filter((t) => t.status !== "concluida" && t.status !== "cancelada").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Contatos", value: contacts.length },
          { label: "Chamados abertos", value: openTickets },
          { label: "Tarefas pendentes", value: openTasks },
          { label: "Promoções ativas", value: data.opportunities.filter((o) => o.active).length },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-white/60 p-4">
            <p className="text-[24px] font-semibold text-foreground">{card.value}</p>
            <p className="text-[13px] text-muted">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white/60 p-6 sm:grid-cols-3">
        <Field label="E-mail" value={profile.email} />
        <Field label="Telefone" value={profile.phone} />
        <Field label="Categoria" value={profile.category} />
        <Field label="Torre" value={profile.towerName ?? "—"} />
        <Field label="Andar / sala" value={`${profile.floor} · ${profile.roomNumber}`} />
        <Field label="Plano" value={profile.plan} />
        <Field label="Status" value={STATUS_LABEL[profile.status] ?? profile.status} />
        <Field label="Fundadora" value={profile.founder ? "Sim" : "Não"} />
        <Field label="Endereço confirmado" value={profile.addressVerified ? "Sim" : "Não"} />
        <Field label="Trial" value={profile.trialStatus ?? "none"} />
        <Field label="Cadastrada em" value={formatDate(profile.createdAt)} />
        {profile.rejectionReason && <Field label="Motivo de rejeição/suspensão" value={profile.rejectionReason} />}
      </div>
      {categories}
    </div>
  );
}

function renderContacts(data: Company360) {
  return (
    <div className="flex flex-col gap-3">
      <NewContactForm businesses={[{ id: data.profile.id, name: data.profile.name }]} />
      {data.contacts.length === 0 && <EmptyState text="Nenhum contato cadastrado pra essa empresa ainda." />}
      {data.contacts.map((contact) => (
        <ContactRow key={contact.id} contact={contact} />
      ))}
    </div>
  );
}

function renderPublicProfile(data: Company360) {
  const { profile, photos, benefits } = data;
  const publicUrl = profile.slug && profile.status === "approved" ? `/pt/empresa/${profile.slug}` : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white/60 p-6">
        {profile.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- logo é upload externo (URL arbitrária), sem domínio fixo pra configurar no next/image
          <img src={profile.logoUrl} alt={profile.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div className="flex-1">
          <p className="text-[16px] font-semibold text-foreground">{profile.name}</p>
          <p className="text-[14px] text-muted">{profile.description || "Sem descrição cadastrada."}</p>
          <p className="mt-1 text-[13px] text-muted">
            {[profile.instagram, profile.websiteUrl].filter(Boolean).join(" · ") || "Sem instagram/site cadastrado."}
          </p>
        </div>
        {publicUrl ? (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="neu-primary rounded-full px-5 py-2.5 text-[13px] font-medium text-white">
            Ver perfil público
          </a>
        ) : (
          <span className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] text-muted">Ainda não publicado</span>
        )}
      </div>

      <div>
        <p className="text-[14px] font-semibold text-foreground">Fotos ({photos.length})</p>
        {photos.length === 0 ? (
          <EmptyState text="Nenhuma foto enviada." />
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element -- foto é upload externo (URL arbitrária), sem domínio fixo pra configurar no next/image
              <img key={photo.id} src={photo.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-[14px] font-semibold text-foreground">Benefícios ({benefits.length})</p>
        {benefits.length === 0 ? (
          <EmptyState text="Nenhum benefício cadastrado." />
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {benefits.map((b) => (
              <li key={b.id} className="rounded-xl border border-border bg-white/60 px-3 py-2 text-[14px] text-foreground">
                {b.title} {!b.active && <span className="text-[12px] text-muted">(inativo)</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function renderPlan(data: Company360) {
  const { profile, subscriptions } = data;
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-border bg-white/60 p-4">
        <Field label="Plano atual" value={profile.plan} />
      </div>
      <p className="text-[14px] font-semibold text-foreground">Assinaturas ({subscriptions.length})</p>
      {subscriptions.length === 0 ? (
        <EmptyState text="Nenhuma assinatura formal registrada — cobrança ainda é manual (ver aba Financeiro)." />
      ) : (
        subscriptions.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3">
            <p className="text-[14px] text-foreground">Plano {s.plan}</p>
            <p className="text-[13px] text-muted">
              {s.status} · início {formatDate(s.startedAt)} · fim {formatDate(s.endsAt)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

function renderFinance(data: Company360, allowed: boolean) {
  if (!allowed) return <EmptyState text="Seu papel não tem acesso a dados financeiros." />;
  const { invoices } = data;
  return (
    <div className="flex flex-col gap-3">
      {invoices.length === 0 ? (
        <EmptyState text="Nenhuma cobrança gerada pra essa empresa ainda." />
      ) : (
        invoices.map((invoice) => (
          <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3">
            <p className="text-[14px] text-foreground">{formatMoney(invoice.amountCents)}</p>
            <p className="text-[13px] text-muted">
              {invoice.status} · gerada {formatDate(invoice.createdAt)}
              {invoice.confirmedAt ? ` · confirmada ${formatDate(invoice.confirmedAt)}` : ""}
            </p>
            {invoice.mercadopagoLink && (
              <a href={invoice.mercadopagoLink} target="_blank" rel="noreferrer" className="tap text-[12px] font-medium text-primary underline">
                Link de pagamento
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function renderPromotions(data: Company360) {
  return (
    <div className="flex flex-col gap-2">
      {data.opportunities.length === 0 ? (
        <EmptyState text="Nenhuma promoção/oportunidade cadastrada." />
      ) : (
        data.opportunities.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-white/60 px-4 py-3">
            <p className="text-[14px] font-medium text-foreground">
              {o.title} {!o.active && <span className="text-[12px] text-muted">(inativa)</span>}
            </p>
            <p className="text-[13px] text-muted">{o.type} {o.description ? `· ${o.description}` : ""}</p>
          </div>
        ))
      )}
    </div>
  );
}

function renderAds(data: Company360) {
  return (
    <div className="flex flex-col gap-2">
      {data.adCampaigns.length === 0 ? (
        <EmptyState text="Essa empresa ainda não tem conta de anunciante vinculada (vínculo é por e-mail igual em ad_accounts) nem campanha publicitária." />
      ) : (
        data.adCampaigns.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3">
            <p className="text-[14px] text-foreground">{c.title}</p>
            <p className="text-[13px] text-muted">
              {c.placementName} · {c.status} · {formatDate(c.startsAt)} a {formatDate(c.endsAt)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

function renderMetrics(data: Company360) {
  const { totalsByType, last30dByType } = data.metrics;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <p className="text-[14px] font-semibold text-foreground">Total acumulado</p>
        {totalsByType.length === 0 ? (
          <EmptyState text="Sem eventos registrados ainda." />
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {totalsByType.map((m) => (
              <li key={m.eventType} className="flex justify-between rounded-xl border border-border bg-white/60 px-3 py-2 text-[14px]">
                <span className="text-muted">{m.eventType}</span>
                <span className="font-medium text-foreground">{m.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-foreground">Últimos 30 dias</p>
        {last30dByType.length === 0 ? (
          <EmptyState text="Sem eventos nos últimos 30 dias." />
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {last30dByType.map((m) => (
              <li key={m.eventType} className="flex justify-between rounded-xl border border-border bg-white/60 px-3 py-2 text-[14px]">
                <span className="text-muted">{m.eventType}</span>
                <span className="font-medium text-foreground">{m.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function renderSupport(data: Company360) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[14px] font-semibold text-foreground">Chamados de suporte ({data.supportTickets.length})</p>
        {data.supportTickets.length === 0 ? (
          <EmptyState text="Nenhum chamado aberto por essa empresa." />
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {data.supportTickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/suporte/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3 hover:bg-white"
              >
                <p className="text-[14px] text-foreground">{t.subject}</p>
                <p className="text-[13px] text-muted">{t.status} · {formatDate(t.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-foreground">Tarefas vinculadas ({data.tasks.length})</p>
        {data.tasks.length === 0 ? (
          <EmptyState text="Nenhuma tarefa vinculada a essa empresa." />
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {data.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderHistory(data: Company360) {
  return (
    <div className="flex flex-col gap-2">
      {data.history.length === 0 ? (
        <EmptyState text="Nenhuma ação administrativa registrada sobre esse cadastro ainda." />
      ) : (
        data.history.map((entry) => (
          <p key={entry.id} className="rounded-xl border border-border bg-white/60 px-3 py-2 text-[14px] text-muted">
            {new Date(entry.createdAt).toLocaleString("pt-BR")} — {HISTORY_ACTION_LABEL[entry.action] ?? entry.action}
          </p>
        ))
      )}
    </div>
  );
}

async function renderCategoriesForm(businessId: string) {
  const [groups, linked] = await Promise.all([getCategoryGroups(), getBusinessCategoryIds(businessId)]);
  return (
    <BusinessCategoriesForm
      groups={groups}
      primaryId={linked.primaryId}
      selectedIds={linked.extraIds}
      onSave={setBusinessCategoriesAction.bind(null, businessId)}
    />
  );
}

export default async function Company360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { adminRole } = await requireAdminPage([
    "super_admin",
    "admin",
    "moderador",
    "comercial",
    "financeiro",
    "marketing",
    "atendimento",
    "analista",
  ]);

  const data = await getCompany360(id);
  if (!data) notFound();

  const financeAllowed = FINANCE_ROLES.includes(adminRole);

  const canEditCategories = ["super_admin", "admin", "comercial", "marketing"].includes(adminRole);
  const categoriesForm = canEditCategories ? await renderCategoriesForm(id) : null;

  return (
    <AdminShell currentPath="/admin/empresas" adminRole={adminRole} wide>
      <div>
        <p className="text-[13px] font-medium uppercase tracking-wide text-muted">
          <Link href="/admin/empresas" className="text-primary underline">
            Empresas
          </Link>{" "}
          / {data.profile.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{data.profile.name}</h1>
        <Link href={`/admin/propostas/nova?businessId=${data.profile.id}`} className="tap mt-2 inline-block text-[14px] font-medium text-primary hover:underline">
          Criar proposta →
        </Link>
        <Link href={`/admin/empresas/${data.profile.id}/landing`} className="tap mt-2 ml-4 inline-block text-[14px] font-medium text-primary hover:underline">
          Editar landing page →
        </Link>
      </div>

      <CompanyTabs
        tabs={[
          { id: "geral", label: "Visão geral", content: renderOverview(data, categoriesForm) },
          { id: "contatos", label: "Contatos", content: renderContacts(data) },
          { id: "perfil", label: "Perfil público", content: renderPublicProfile(data) },
          { id: "plano", label: "Plano e contrato", content: renderPlan(data) },
          { id: "financeiro", label: "Financeiro", content: renderFinance(data, financeAllowed) },
          { id: "promocoes", label: "Promoções", content: renderPromotions(data) },
          { id: "publicidade", label: "Publicidade e campanhas", content: renderAds(data) },
          { id: "metricas", label: "Métricas", content: renderMetrics(data) },
          { id: "atendimento", label: "Atendimento", content: renderSupport(data) },
          { id: "historico", label: "Histórico", content: renderHistory(data) },
        ]}
      />
    </AdminShell>
  );
}
