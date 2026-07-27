import { requireAdminPage } from "@/lib/auth-guards";
import { getAllHotelsForAdmin } from "@/lib/services/hotels";
import { NewHotelForm } from "@/components/admin/NewHotelForm";
import { HotelRow } from "@/components/admin/HotelRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Hotéis — Cerâmica Hub" };

export default async function AdminHoteisPage() {
  await requireAdminPage(["super_admin", "admin"]);
  const hotels = await getAllHotelsForAdmin();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Hotéis (Business Travel)</h1>
            <p className="mt-2 text-[16px] text-muted">
              Só publique dados confirmados (tarifas, disponibilidade e benefícios nunca devem ser inventados).
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewHotelForm />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Hotéis ({hotels.length})</p>
          {hotels.length === 0 && <p className="text-[15px] text-muted">Nenhum hotel cadastrado ainda.</p>}
          {hotels.map((hotel) => (
            <HotelRow key={hotel.id} hotel={hotel} />
          ))}
        </section>
      </div>
    </main>
  );
}
