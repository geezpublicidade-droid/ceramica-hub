import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryContentForm } from "@/components/admin/CategoryContentForm";
import { listCategoryContent } from "@/lib/services/category-content-admin";

export const metadata = { title: "Conteúdo das categorias — Cerâmica Hub" };

export default async function CategoryContentPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing"]);
  const categories = await listCategoryContent();

  return (
    <AdminShell currentPath="/admin/publicidade/categorias" adminRole={adminRole} wide>
      <div>
        <Link href="/admin/publicidade/categorias" className="tap text-[14px] text-muted hover:text-primary">
          ← Publicidade por categoria
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Conteúdo das categorias</h1>
        <p className="mt-2 max-w-3xl text-[16px] text-muted">
          Foto, título, descrição, painel comercial e texto de SEO da vitrine de cada categoria. Campo vazio usa o texto padrão; a
          subcategoria herda foto e painel da categoria-mãe.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {categories.map((category) => (
          <CategoryContentForm key={category.id} category={category} />
        ))}
      </div>
    </AdminShell>
  );
}
