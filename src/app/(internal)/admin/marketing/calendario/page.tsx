import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getContentItemsForMonth } from "@/lib/services/content-calendar";
import { getAssignableAdmins } from "@/lib/services/admins";
import { listCompaniesForAdmin } from "@/lib/services/companies";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentCalendarGrid } from "@/components/admin/ContentCalendarGrid";
import { ContentItemForm } from "@/components/admin/ContentItemForm";

export const metadata = { title: "Calendário de conteúdo — Cerâmica Hub" };

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7);
}

export default async function ContentCalendarPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "conteudo"]);
  const { mes } = await searchParams;
  const month = mes && MONTH_PATTERN.test(mes) ? mes : new Date().toISOString().slice(0, 7);

  const [items, admins, companies] = await Promise.all([
    getContentItemsForMonth(month),
    getAssignableAdmins(),
    listCompaniesForAdmin(),
  ]);

  const [year, monthNumber] = month.split("-").map(Number);
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = today.startsWith(month) ? today : `${month}-01`;

  return (
    <AdminShell currentPath="/admin/marketing/calendario" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Calendário de conteúdo</h1>
        <p className="mt-2 text-[16px] text-muted">
          Posts, destaques de empresas, campanhas, eventos, newsletters e banners — do briefing à publicação.
        </p>
      </div>

      <ContentItemForm defaultDate={defaultDate} options={{ admins, companies }} />

      <div className="flex items-center justify-between gap-3">
        <Link href={`?mes=${shiftMonth(month, -1)}`} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
          ← Anterior
        </Link>
        <h2 className="text-[18px] font-semibold text-foreground">
          {MONTH_NAMES[monthNumber - 1]} {year}
        </h2>
        <Link href={`?mes=${shiftMonth(month, 1)}`} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
          Próximo →
        </Link>
      </div>

      <ContentCalendarGrid month={month} items={items} />
    </AdminShell>
  );
}
