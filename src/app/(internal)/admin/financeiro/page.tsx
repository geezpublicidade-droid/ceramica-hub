import { requireAdminPage } from "@/lib/auth-guards";
import { getPendingInvoices } from "@/lib/services/platform";
import { AdminInvoiceRow } from "@/components/admin/AdminInvoiceRow";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Financeiro — Cerâmica Hub" };

export default async function AdminFinanceiroPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "financeiro"]);

  const pendingInvoices = await getPendingInvoices();

  return (
    <AdminShell currentPath="/admin/financeiro" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
        <p className="mt-2 text-[16px] text-muted">
          Faturas aguardando confirmação manual de pagamento (Mercado Pago).
        </p>
      </div>

      <section className="flex flex-col gap-3">
        {pendingInvoices.length === 0 && (
          <p className="text-[16px] text-muted">Nenhuma fatura pendente de confirmação.</p>
        )}
        {pendingInvoices.map((invoice) => (
          <AdminInvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </section>
    </AdminShell>
  );
}
