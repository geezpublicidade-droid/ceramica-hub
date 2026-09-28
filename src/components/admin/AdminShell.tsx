import type { AdminRole } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";

/** Layout de duas colunas compartilhado por toda página de /admin -- mesmo
 * espírito do aside+conteúdo já usado em /dashboard, só que aqui extraído
 * num único componente desde o início (17 páginas usam), em vez de repetir
 * o markup do aside em cada uma. */
export function AdminShell({
  currentPath,
  adminRole,
  children,
}: {
  currentPath: string;
  adminRole: AdminRole;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <AdminNav currentPath={currentPath} adminRole={adminRole} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-4xl">{children}</div>
      </div>
    </main>
  );
}
