import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllListingsForAdmin } from "@/lib/services/real-estate";
import { NewListingForm } from "@/components/admin/NewListingForm";
import { ListingRow } from "@/components/admin/ListingRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Imobiliárias — Cerâmica Hub" };

async function getTowers() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("towers").select("id, name").eq("active", true).order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function AdminImobiliariasPage() {
  await requireAdminPage(["super_admin", "admin"]);
  const [listings, towers] = await Promise.all([getAllListingsForAdmin(), getTowers()]);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Imobiliárias</h1>
            <p className="mt-2 text-[16px] text-muted">
              Venda e locação de lajes/salas comerciais. Preço é opcional — só preencha com valor real.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewListingForm towers={towers} />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Anúncios ({listings.length})</p>
          {listings.length === 0 && <p className="text-[15px] text-muted">Nenhum imóvel cadastrado ainda.</p>}
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </section>
      </div>
    </main>
  );
}
