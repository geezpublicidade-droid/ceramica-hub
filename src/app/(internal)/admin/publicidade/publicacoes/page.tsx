import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { BackLink } from "@/components/nav/BackLink";
import { PublicationAdminRow, type AdminPublication } from "@/components/admin/PublicationAdminRow";
import { PublicationProductForm } from "@/components/admin/PublicationProductForm";

export const metadata = { title: "Publicações — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function AdminPublicacoesPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial", "marketing", "financeiro"]);
  const supabase = createServiceClient();
  const [bookings, products] = await Promise.all([
    supabase
      .from("publication_bookings")
      .select("id, title, body, image_url, link_url, scheduled_for, time_slot, status, payment_status, price_cents, correction_note, businesses(name), publication_products(name)")
      .neq("status", "cancelado")
      .order("scheduled_for", { ascending: true }),
    supabase.from("publication_products").select("id, name, price_cents, capacity_per_slot, active").order("sort_order"),
  ]);
  if (bookings.error) throw bookings.error;
  if (products.error) throw products.error;

  const items: AdminPublication[] = (bookings.data ?? []).map((row) => ({
    id: row.id,
    businessName: (row.businesses as unknown as { name: string } | null)?.name ?? "Empresa",
    productName: (row.publication_products as unknown as { name: string } | null)?.name ?? "Publicação",
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    scheduledFor: row.scheduled_for,
    timeSlot: row.time_slot,
    status: row.status,
    paymentStatus: row.payment_status,
    priceCents: row.price_cents,
    correctionNote: row.correction_note,
  }));
  const open = items.filter((item) => item.status !== "publicado");
  const done = items.filter((item) => item.status === "publicado");

  return (
    <AdminShell currentPath="/admin/publicidade/publicacoes" adminRole={adminRole}>
      <div>
        <BackLink href="/admin/publicidade" />
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Publicações reservadas</h1>
        <p className="mt-2 text-[16px] text-muted">
          Stories, newsletter e matérias que as empresas reservaram. Aprovar agenda a publicação; depois de postar, marque como publicado. Cada item também aparece no calendário de conteúdo.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Produtos à venda</p>
        <ul className="flex flex-col gap-3">
          {(products.data ?? []).map((product) => (
            <PublicationProductForm key={product.id} id={product.id} name={product.name} priceCents={product.price_cents} capacityPerSlot={product.capacity_per_slot} active={product.active} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Fila ({open.length})</p>
        {open.length === 0 ? <p className="text-[15px] text-muted">Nenhuma reserva em aberto.</p> : <ul className="flex flex-col gap-3">{open.map((item) => <PublicationAdminRow key={item.id} item={item} />)}</ul>}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Publicadas ({done.length})</p>
          <ul className="flex flex-col gap-3">{done.slice(-20).map((item) => <PublicationAdminRow key={item.id} item={item} />)}</ul>
        </section>
      )}
    </AdminShell>
  );
}
