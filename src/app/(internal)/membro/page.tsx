import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getMemberFavorites, getClaimableCoupons } from "@/lib/services/platform";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { IconCoupon } from "@/components/dashboard/nav-icons";
import { FavoriteCard } from "@/components/member/FavoriteCard";
import { MemberPrivacyControls } from "@/components/member/MemberPrivacyControls";

export const metadata = { title: "Meus favoritos — Cerâmica Hub" };

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function MemberPage() {
  const session = await auth();
  const memberId = session?.user?.memberId;
  const [favorites, coupons] = await Promise.all([
    memberId ? getMemberFavorites(memberId) : Promise.resolve([]),
    getClaimableCoupons(),
  ]);

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
          href="/membro/cupons"
          className="gradient-terracotta-animated flex items-center justify-between gap-4 rounded-3xl p-6 text-white transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <IconCoupon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-white/70">Novidade</p>
              <p className="mt-0.5 text-[18px] font-semibold">
                {coupons.length > 0
                  ? `${coupons.length} ${coupons.length === 1 ? "cupom disponível" : "cupons disponíveis"}`
                  : "Cupons e descontos"}
              </p>
            </div>
          </div>
          <span aria-hidden="true" className="text-[20px]">→</span>
        </Link>

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
              <FavoriteCard key={business.id} business={business} />
            ))}
          </div>
        )}

        <MemberPrivacyControls />
      </div>
    </main>
  );
}
