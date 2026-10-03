import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { PromotionKit } from "@/components/promo/PromotionKit";
import { getAllBusinesses } from "@/lib/services/platform";
import { localizedUrl, siteUrl } from "@/lib/seo";

export const metadata = { title: "Divulgação — Cerâmica Hub" };
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ empresa?: string }> };

/** Kit de divulgação de qualquer empresa aprovada: artes para postar, links rastreados e QR Code. */
export default async function AdminPromotionPage({ searchParams }: PageProps) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "comercial"]);
  const { empresa } = await searchParams;

  const businesses = (await getAllBusinesses()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const selected = businesses.find((business) => business.slug === empresa);

  return (
    <AdminShell currentPath="/admin/marketing/divulgacao" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Divulgação</h1>
        <p className="mt-2 max-w-3xl text-[16px] text-muted">
          Artes prontas (post, story e miniatura de link), links com rastreio por canal e QR Code de qualquer empresa aprovada. Use nas redes do Hub, em anúncios e em materiais impressos.
        </p>
      </div>

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="empresa">
          Empresa
        </label>
        <select
          id="empresa"
          name="empresa"
          defaultValue={selected?.slug ?? ""}
          className="min-h-11 flex-1 rounded-xl border border-border bg-white px-4 text-[15px] text-foreground"
        >
          <option value="">Escolha a empresa</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.slug}>
              {business.name}
            </option>
          ))}
        </select>
        <button type="submit" className="neu-primary min-h-11 rounded-full px-6 text-[15px] font-medium text-white">
          Ver kit
        </button>
      </form>

      {selected && (
        <PromotionKit profileUrl={localizedUrl("pt", `/empresa/${selected.slug}`)} siteUrl={siteUrl} slug={selected.slug} name={selected.name} />
      )}
    </AdminShell>
  );
}
