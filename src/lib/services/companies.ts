import { createServiceClient } from "@/lib/supabase/server";

export type CompanyListItem = {
  id: string;
  name: string;
  email: string;
  category: string;
  plan: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  towerName: string | null;
  createdAt: string;
};

/** Diretório completo de empresas pra Comercial (`/admin/empresas`) --
 * distinto da fila de aprovação do dashboard (`/admin`), que só mostra
 * pendentes/aprovadas/suspensas/rejeitadas em blocos fixos. Aqui é
 * busca+filtro livre, cada linha leva pra Empresa 360° (`/admin/empresas/[id]`). */
export async function listCompaniesForAdmin(): Promise<CompanyListItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, email, category, plan, status, created_at, towers(name)")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    category: row.category,
    plan: row.plan,
    status: row.status,
    towerName: (row.towers as unknown as { name: string } | null)?.name ?? null,
    createdAt: row.created_at,
  }));
}
