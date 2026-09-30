import { requireAdminPage } from "@/lib/auth-guards";
import { getAllAudiences } from "@/lib/services/marketing-audiences";
import { getAllCampaigns, getAllTemplates } from "@/lib/services/email-marketing";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmailComposer } from "@/components/admin/EmailComposer";
import { EmailCampaignRow } from "@/components/admin/EmailCampaignRow";

export const metadata = { title: "E-mail marketing — Cerâmica Hub" };

export default async function EmailMarketingPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing"]);
  const [campaigns, templates, audiences] = await Promise.all([getAllCampaigns(), getAllTemplates(), getAllAudiences()]);

  return (
    <AdminShell currentPath="/admin/marketing/email" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">E-mail marketing</h1>
        <p className="mt-2 text-[16px] text-muted">
          Newsletter, promoções, comunicados, convites, boas-vindas, renovação e reativação — com métricas por disparo, link de
          descadastro em todo e-mail e envio só para quem deu consentimento.
        </p>
      </div>

      {!process.env.RESEND_API_KEY && (
        <p className="rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-[14px] text-warning">
          O envio de e-mail ainda não está configurado neste ambiente (falta RESEND_API_KEY). Você pode montar públicos e
          campanhas, mas os disparos vão falhar até configurar. Para as métricas de entrega, abertura e clique, cadastre no Resend o
          webhook <code>/api/webhooks/resend</code> e defina RESEND_WEBHOOK_SECRET.
        </p>
      )}

      <EmailComposer templates={templates} audiences={audiences} />

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Campanhas ({campaigns.length})</h2>
        <div className="mt-3 flex flex-col gap-3">
          {campaigns.length === 0 && <p className="text-[15px] text-muted">Nenhuma campanha ainda.</p>}
          {campaigns.map((campaign) => (
            <EmailCampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
