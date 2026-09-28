import { requireAdminPage } from "@/lib/auth-guards";
import { getAllHotelsForAdmin } from "@/lib/services/hotels";
import { NewHotelForm } from "@/components/admin/NewHotelForm";
import { HotelRow } from "@/components/admin/HotelRow";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Hotéis — Cerâmica Hub" };

export default async function AdminHoteisPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin"]);
  const hotels = await getAllHotelsForAdmin();

  return (
    <AdminShell currentPath="/admin/hoteis" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Hotéis (Business Travel)</h1>
        <p className="mt-2 text-[16px] text-muted">
          Só publique dados confirmados (tarifas, disponibilidade e benefícios nunca devem ser inventados).
        </p>
      </div>

      <NewHotelForm />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Hotéis ({hotels.length})</p>
        {hotels.length === 0 && <p className="text-[15px] text-muted">Nenhum hotel cadastrado ainda.</p>}
        {hotels.map((hotel) => (
          <HotelRow key={hotel.id} hotel={hotel} />
        ))}
      </section>
    </AdminShell>
  );
}
