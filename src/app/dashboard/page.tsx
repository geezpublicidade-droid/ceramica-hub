import { auth, signOut } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";

export const metadata = { title: "Painel — Cerâmica Hub" };

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function DashboardPage() {
  const session = await auth();
  const business = session?.user?.businessId
    ? await getBusinessById(session.user.businessId)
    : undefined;

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-muted">Painel da empresa</p>
            <h1 className="text-2xl font-semibold text-foreground">
              {business?.name ?? "Empresa não encontrada"}
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground"
            >
              Sair
            </button>
          </form>
        </div>

        {business ? (
          <div className="glass-light grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
            <div>
              <p className="text-[12px] text-muted">Categoria</p>
              <p className="text-[14px] text-foreground">{business.category}</p>
            </div>
            <div>
              <p className="text-[12px] text-muted">Andar</p>
              <p className="text-[14px] text-foreground">{business.floor}</p>
            </div>
            <div>
              <p className="text-[12px] text-muted">Instagram</p>
              <p className="text-[14px] text-foreground">{business.instagram}</p>
            </div>
            <div>
              <p className="text-[12px] text-muted">WhatsApp</p>
              <p className="text-[14px] text-foreground">{business.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[12px] text-muted">Descrição</p>
              <p className="text-[14px] text-foreground">{business.description}</p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
