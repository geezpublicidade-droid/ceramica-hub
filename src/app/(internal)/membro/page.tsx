import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getMemberFavorites } from "@/lib/services/platform";
import { SignOutButton } from "@/components/nav/SignOutButton";

export const metadata = { title: "Meus favoritos — Cerâmica Hub" };

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function MemberPage() {
  const session = await auth();
  const memberId = session?.user?.memberId;
  const favorites = memberId ? await getMemberFavorites(memberId) : [];

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] text-muted">Sua conta</p>
            <h1 className="text-2xl font-semibold text-foreground">
              {session?.user?.name ?? "Meus favoritos"}
            </h1>
          </div>
          <SignOutButton action={logout} />
        </div>

        <Link
          href="/membro/suporte"
          className="glass-light flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition hover:bg-black/5"
        >
          <span className="text-[15px] font-medium text-foreground">Precisa de ajuda? Fale com o suporte</span>
          <span aria-hidden="true" className="text-primary">→</span>
        </Link>

        {favorites.length === 0 ? (
          <p className="text-[15px] text-muted">
            Você ainda não favoritou nenhuma empresa. Explore o{" "}
            <Link href="/preview#empresas" className="text-primary underline">
              diretório
            </Link>{" "}
            e clique no coração da empresa pra guardar aqui.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {favorites.map((business) => (
              <Link
                key={business.id}
                href={`/empresa/${business.slug}`}
                className="glass-light rounded-2xl p-4 transition hover:bg-black/5"
              >
                <p className="font-semibold text-foreground">{business.name}</p>
                <p className="text-[14px] text-muted">{business.category}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
