import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminBusinessRow } from "@/components/admin/AdminBusinessRow";
import { ApprovedBusinessRow } from "@/components/admin/ApprovedBusinessRow";
import { SuspendedBusinessRow } from "@/components/admin/SuspendedBusinessRow";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminDashboardStats, getProfileCompletenessMap } from "@/lib/services/admin-dashboard";
import { countOpenTicketsForAdmin } from "@/lib/services/support";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { signOut } from "@/auth";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/admin/login" });
}

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
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  founder: boolean;
  plan: "presenca" | "profissional" | "destaque" | "experiencia" | "premium";
  trial_status: "none" | "active" | "expired";
  rejection_reason: string | null;
  comprovante_path: string | null;
  address_verified: boolean;
  towers: { name: string } | null;
};

async function getBusinessesByStatus(status: "pending" | "approved" | "rejected" | "suspended") {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, responsible_name, email, category, phone, document, floor, room_number, status, created_at, founder, plan, trial_status, rejection_reason, comprovante_path, address_verified, towers(name)",
    )
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PendingBusiness[];
}

export default async function AdminPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "moderador"]);

  const [pending, approved, rejected, suspended, stats, completeness, openTickets] = await Promise.all([
    getBusinessesByStatus("pending"),
    getBusinessesByStatus("approved"),
    getBusinessesByStatus("rejected"),
    getBusinessesByStatus("suspended"),
    getAdminDashboardStats(),
    getProfileCompletenessMap(),
    countOpenTicketsForAdmin(),
  ]);

  const statGroups: { title: string; cards: { label: string; value: number }[] }[] = [
    {
      title: "Cadastros de empresas",
      cards: [
        { label: "Pendentes", value: pending.length },
        { label: "Aprovadas", value: approved.length },
        { label: "Suspensas", value: suspended.length },
        { label: "Cadastros (7 dias)", value: stats.recentSignups7d },
        { label: "Perfis incompletos", value: stats.incompleteProfiles },
      ],
    },
    {
      title: "Publicidade e engajamento",
      cards: [
        { label: "Campanhas ativas", value: stats.activeCampaigns },
        { label: "Impressões de anúncio (30d)", value: stats.adImpressionsLast30d },
        { label: "Cliques em anúncio (30d)", value: stats.adClicksLast30d },
        { label: "Buscas (30d)", value: stats.searchesLast30d },
        { label: "Oportunidades ativas", value: stats.activeOpportunities },
        { label: "Promoções ativas", value: stats.activePromotions },
      ],
    },
    {
      title: "Suporte",
      cards: [{ label: "Chamados de suporte abertos", value: openTickets }],
    },
  ];

  return (
    <AdminShell currentPath="/admin" adminRole={adminRole}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Painel administrativo</h1>
          <p className="mt-2 text-[16px] text-muted">
            Aprove ou rejeite cadastros de empresas antes que a página fique pública.
          </p>
        </div>
        <SignOutButton action={logout} />
      </div>

      {statGroups.map((group) => (
        <section key={group.title} className="mt-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{group.title}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.cards.map((card) => (
              <AdminStatCard key={card.label} label={card.label} value={card.value} highlight={card.label === "Pendentes" && card.value > 0} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-6">
        <h2 className="text-[17px] font-semibold text-foreground">
          Pendentes ({pending.length})
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {pending.length === 0 && <p className="text-[16px] text-muted">Nenhum cadastro pendente.</p>}
          {pending.map((b) => (
            <AdminBusinessRow key={b.id} business={b} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[17px] font-semibold text-foreground">
          Aprovadas ({approved.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {approved.map((b) => (
            <ApprovedBusinessRow
              key={b.id}
              business={{
                id: b.id,
                name: b.name,
                towerName: b.towers?.name ?? null,
                floor: b.floor,
                roomNumber: b.room_number,
                founder: b.founder,
                plan: b.plan,
                trialStatus: b.trial_status,
                missingItems: completeness.get(b.id) ?? [],
                comprovantePath: b.comprovante_path,
                addressVerified: b.address_verified,
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[17px] font-semibold text-foreground">
          Suspensas ({suspended.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {suspended.length === 0 && <p className="text-[16px] text-muted">Nenhuma empresa suspensa.</p>}
          {suspended.map((b) => (
            <SuspendedBusinessRow
              key={b.id}
              business={{
                id: b.id,
                name: b.name,
                towerName: b.towers?.name ?? null,
                floor: b.floor,
                roomNumber: b.room_number,
                rejectionReason: b.rejection_reason,
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[17px] font-semibold text-foreground">
          Rejeitadas ({rejected.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {rejected.map((b) => (
            <p key={b.id} className="text-[15px] text-muted">
              {b.name} — {b.email}
            </p>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
