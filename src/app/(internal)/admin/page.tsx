import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminBusinessRow } from "@/components/admin/AdminBusinessRow";

export const metadata = { title: "Painel administrativo — Cerâmica Hub" };

type PendingBusiness = {
  id: string;
  name: string;
  responsible_name: string | null;
  email: string;
  category: string;
  phone: string;
  document: string | null;
  floor: string;
  room_number: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  towers: { name: string } | null;
};

async function getBusinessesByStatus(status: "pending" | "approved" | "rejected") {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, responsible_name, email, category, phone, document, floor, room_number, status, created_at, towers(name)")
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PendingBusiness[];
}

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/login");
  }

  const [pending, approved, rejected] = await Promise.all([
    getBusinessesByStatus("pending"),
    getBusinessesByStatus("approved"),
    getBusinessesByStatus("rejected"),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-foreground">Painel administrativo</h1>
        <p className="mt-2 text-[14px] text-muted">
          Aprove ou rejeite cadastros de empresas antes que a página fique pública.
        </p>

        <section className="mt-10">
          <h2 className="text-[15px] font-semibold text-foreground">
            Pendentes ({pending.length})
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {pending.length === 0 && <p className="text-[14px] text-muted">Nenhum cadastro pendente.</p>}
            {pending.map((b) => (
              <AdminBusinessRow key={b.id} business={b} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-[15px] font-semibold text-foreground">
            Aprovadas ({approved.length})
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {approved.map((b) => (
              <p key={b.id} className="text-[13px] text-muted">
                {b.name} — {b.towers?.name} · {b.floor} · sala {b.room_number}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-[15px] font-semibold text-foreground">
            Rejeitadas ({rejected.length})
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {rejected.map((b) => (
              <p key={b.id} className="text-[13px] text-muted">
                {b.name} — {b.email}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
