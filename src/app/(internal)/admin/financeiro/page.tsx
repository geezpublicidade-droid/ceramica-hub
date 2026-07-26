import { requireAdminPage } from "@/lib/auth-guards";
import { getPendingInvoices } from "@/lib/services/platform";
import { AdminInvoiceRow } from "@/components/admin/AdminInvoiceRow";

export const metadata = { title: "Financeiro — Cerâmica Hub" };

export default async function AdminFinanceiroPage() {
  await requireAdminPage(["super_admin", "admin", "financeiro"]);

  const pendingInvoices = await getPendingInvoices();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
            <p className="mt-2 text-[14px] text-muted">
              Faturas aguardando confirmação manual de pagamento (Mercado Pago).
            </p>
          </div>
          <a href="/admin" className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground">
            ← Voltar
          </a>
        </div>

        <section className="mt-10 flex flex-col gap-3">
          {pendingInvoices.length === 0 && (
            <p className="text-[14px] text-muted">Nenhuma fatura pendente de confirmação.</p>
          )}
          {pendingInvoices.map((invoice) => (
            <AdminInvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </section>
      </div>
    </main>
  );
}
