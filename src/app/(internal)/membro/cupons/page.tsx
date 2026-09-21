import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClaimableCoupons } from "@/lib/services/platform";
import { BackLink } from "@/components/nav/BackLink";
import { CouponCard } from "@/components/member/CouponCard";

export const metadata = { title: "Cupons — Cerâmica Hub" };

export default async function MemberCouponsPage() {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/membro/login");

  const coupons = await getClaimableCoupons();

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="mb-2">
          <BackLink href="/membro" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cupons e descontos</h1>
          <p className="mt-2 text-[16px] text-muted">
            Benefícios exclusivos das empresas do Cerâmica Hub. Revele o cupom e mostre na hora de comprar.
          </p>
        </div>

        {coupons.length === 0 ? (
          <p className="text-[15px] text-muted">Nenhum cupom disponível no momento — volte em breve.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {coupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                id={coupon.id}
                kind={coupon.kind}
                title={coupon.title}
                description={coupon.description}
                couponCode={coupon.couponCode!}
                validUntil={coupon.validUntil}
                business={coupon.business}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
