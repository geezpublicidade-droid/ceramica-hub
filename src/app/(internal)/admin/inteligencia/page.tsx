import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { getMarketingIntelligence } from "@/lib/services/marketing-intelligence";

export const metadata = { title: "Inteligência de marketing — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "comercial", "analista"]);
  const sections = await getMarketingIntelligence();

  return (
    <AdminShell currentPath="/admin/inteligencia" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inteligência de marketing</h1>
        <p className="mt-2 text-[16px] text-muted">
          Recomendações calculadas dos dados reais dos últimos 30 dias. Quando faltam dados, o painel avisa em vez de sugerir no escuro.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.key} className="rounded-2xl border border-border bg-white/70 p-4">
            <h2 className="text-[16px] font-semibold text-foreground">{section.title}</h2>
            <p className="mt-1 text-[13px] text-muted">{section.description}</p>
            {section.items.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">{section.emptyMessage}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={`${item.title}-${item.detail}`} className="text-[14px]">
                    {item.href ? (
                      <Link href={item.href} className="tap font-medium text-primary underline">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{item.title}</span>
                    )}
                    <span className="block text-muted">{item.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
