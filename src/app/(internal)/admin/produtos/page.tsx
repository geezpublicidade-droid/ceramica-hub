import { requireAdminPage } from "@/lib/auth-guards";
import { getAllProducts } from "@/lib/services/products";
import { ProductManager } from "@/components/admin/ProductManager";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Produtos e planos — Cerâmica Hub" };

export default async function AdminProductsPage() {
  const { adminRole } = await requireAdminPage(["super_admin"]);
  const products = await getAllProducts();

  return (
    <AdminShell currentPath="/admin/produtos" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Produtos e planos</h1>
        <p className="mt-2 text-[16px] text-muted">
          Tudo o que o Cerâmica Hub vende — planos, espaços publicitários, patrocínios, páginas especiais e serviços
          adicionais. Preços, benefícios e limites são editados aqui e alimentam as propostas.
        </p>
      </div>

      <ProductManager products={products} />
    </AdminShell>
  );
}
