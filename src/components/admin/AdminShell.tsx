import type { AdminRole } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";

/** Layout de duas colunas compartilhado por toda página de /admin -- mesmo
 * espírito do aside+conteúdo já usado em /dashboard, só que aqui extraído
 * num único componente desde o início (17 páginas usam), em vez de repetir
 * o markup do aside em cada uma. */
export function AdminShell({
  currentPath,
  adminRole,
  wide,
  children,
}: {
  currentPath: string;
  adminRole: AdminRole;
  /** true pras páginas que precisam de mais largura que o 4xl padrão (ex:
   * board Kanban de publicidade, com várias colunas lado a lado). */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="admin-theme min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-12 lg:py-20">
      <div className={`mx-auto flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <AdminNav currentPath={currentPath} adminRole={adminRole} />
        </aside>

        <div className={`flex min-w-0 flex-1 flex-col gap-6 ${wide ? "" : "lg:max-w-4xl"}`}>{children}</div>
      </div>
    </main>
  );
}
