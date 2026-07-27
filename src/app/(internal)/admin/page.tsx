import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminBusinessRow } from "@/components/admin/AdminBusinessRow";
import { ApprovedBusinessRow } from "@/components/admin/ApprovedBusinessRow";
import { getAdminDashboardStats } from "@/lib/services/admin-dashboard";
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
  status: "pending" | "approved" | "rejected";
  created_at: string;
  founder: boolean;
  plan: "presenca" | "profissional" | "destaque" | "experiencia";
  trial_status: "none" | "active" | "expired";
  towers: { name: string } | null;
};

async function getBusinessesByStatus(status: "pending" | "approved" | "rejected") {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, responsible_name, email, category, phone, document, floor, room_number, status, created_at, founder, plan, trial_status, towers(name)",
    )
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PendingBusiness[];
}

export default async function AdminPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "moderador"]);

  const [pending, approved, rejected, stats] = await Promise.all([
    getBusinessesByStatus("pending"),
    getBusinessesByStatus("approved"),
    getBusinessesByStatus("rejected"),
    getAdminDashboardStats(),
  ]);

  const statCards: { label: string; value: number }[] = [
    { label: "Pendentes", value: pending.length },
    { label: "Aprovadas", value: approved.length },
    { label: "Cadastros (7 dias)", value: stats.recentSignups7d },
    { label: "Campanhas ativas", value: stats.activeCampaigns },
    { label: "Impressões de anúncio (30d)", value: stats.adImpressionsLast30d },
    { label: "Cliques em anúncio (30d)", value: stats.adClicksLast30d },
    { label: "Buscas (30d)", value: stats.searchesLast30d },
    { label: "Oportunidades ativas", value: stats.activeOpportunities },
    { label: "Promoções ativas", value: stats.activePromotions },
    { label: "Perfis incompletos", value: stats.incompleteProfiles },
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Painel administrativo</h1>
            <p className="mt-2 text-[16px] text-muted">
              Aprove ou rejeite cadastros de empresas antes que a página fique pública.
            </p>
          </div>
          <div className="flex gap-2">
            {(adminRole === "super_admin" || adminRole === "admin" || adminRole === "financeiro") && (
              <Link href="/admin/financeiro" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Financeiro
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin") && (
              <Link href="/admin/lgpd" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                LGPD
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin" || adminRole === "comercial") && (
              <Link href="/admin/publicidade" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Publicidade
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin") && (
              <Link href="/admin/blog" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Blog
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin") && (
              <Link href="/admin/parceiros" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Parceiros
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin" || adminRole === "comercial") && (
              <Link href="/admin/leads" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Leads
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin") && (
              <Link href="/admin/hoteis" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Hotéis
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin") && (
              <Link href="/admin/auditorios" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Auditórios
              </Link>
            )}
            {(adminRole === "super_admin" || adminRole === "admin") && (
              <Link href="/admin/imobiliarias" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Imobiliárias
              </Link>
            )}
            {adminRole === "super_admin" && (
              <Link href="/admin/usuarios" className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
                Usuários
              </Link>
            )}
            <SignOutButton action={logout} />
          </div>
        </div>

        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-white/70 p-4">
              <p className="text-[22px] font-semibold text-foreground">{card.value}</p>
              <p className="mt-1 text-[13px] text-muted">{card.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
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

        <section className="mt-12">
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
                }}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
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
      </div>
    </main>
  );
}
