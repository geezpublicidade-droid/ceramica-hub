import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReferralRewardForm } from "@/components/admin/ReferralRewardForm";
import { getReferralOverview } from "@/lib/services/referrals";
import { formatDateTimeBR } from "@/lib/utils";

export const metadata = { title: "Indicações — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const th = "px-3 py-2 text-left text-[13px] font-medium text-muted";
const td = "px-3 py-2 align-top text-[14px] text-foreground";
const TYPE_LABEL = { business: "Empresa", member: "Membro" } as const;
const STATUS_LABEL = { cadastrada: "Cadastrada", convertida: "Convertida" } as const;

export default async function ReferralsAdminPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "financeiro", "comercial"]);
  const { ranking, history } = await getReferralOverview();
  const pending = history.filter((entry) => entry.rewardStatus === "pendente");

  return (
    <AdminShell currentPath="/admin/indicacoes" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Programa de indicações</h1>
        <p className="mt-2 text-[16px] text-muted">
          Empresas e membros indicam novas empresas por código. A indicação vira “convertida” quando o primeiro pagamento da empresa indicada é confirmado.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white/70 p-5">
        <h2 className="text-[18px] font-semibold text-foreground">Recompensas pendentes ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted">Nenhuma recompensa aguardando.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {pending.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-2">
                <p className="text-[14px] text-foreground">
                  <strong>{entry.referrerName}</strong> indicou <strong>{entry.referredName}</strong>
                </p>
                <ReferralRewardForm referralId={entry.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-semibold text-foreground">Ranking de indicadores</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-white/70">
          <table className="w-full">
            <thead>
              <tr><th className={th}>Quem</th><th className={th}>Tipo</th><th className={th}>Cadastros</th><th className={th}>Convertidas</th><th className={th}>Pendentes</th></tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={`${row.type}:${row.id}`} className="border-t border-border">
                  <td className={td}>{row.name}</td>
                  <td className={td}>{TYPE_LABEL[row.type]}</td>
                  <td className={td}>{row.registered}</td>
                  <td className={td}>{row.converted}</td>
                  <td className={td}>{row.pendingRewards}</td>
                </tr>
              ))}
              {ranking.length === 0 && <tr><td colSpan={5} className={`${td} text-muted`}>Nenhuma indicação registrada ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-semibold text-foreground">Histórico</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-white/70">
          <table className="w-full">
            <thead>
              <tr><th className={th}>Quando</th><th className={th}>Indicador</th><th className={th}>Empresa indicada</th><th className={th}>Situação</th><th className={th}>Recompensa</th></tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className={td}>{formatDateTimeBR(entry.createdAt)}</td>
                  <td className={td}>{entry.referrerName}</td>
                  <td className={td}>{entry.referredName}</td>
                  <td className={td}>{STATUS_LABEL[entry.status]}</td>
                  <td className={td}>{entry.rewardStatus === "concedida" ? entry.rewardNote : entry.rewardStatus === "pendente" ? "Pendente" : "—"}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={5} className={`${td} text-muted`}>Sem histórico.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
