import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClaimableCoupons, getMemberCouponHistory } from "@/lib/services/platform";
import { BackLink } from "@/components/nav/BackLink";
import { CouponCard } from "@/components/member/CouponCard";

export const metadata = { title: "Cupons — Cerâmica Hub" };

export default async function MemberCouponsPage() {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) redirect("/membro/login");

  const [allCoupons, history] = await Promise.all([getClaimableCoupons(), getMemberCouponHistory(memberId)]);
  const claimedIds = new Set(history.map((claim) => claim.id));
  const coupons = allCoupons.filter((coupon) => !claimedIds.has(coupon.id));

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="mb-2">
          <BackLink href="/membro" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cupons e descontos</h1>
          <p className="mt-2 text-[16px] text-muted">
            Benefícios exclusivos das empresas do Cerâmica Hub. Revele o cupom e mostre na hora de comprar.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          {coupons.length === 0 ? (
            <p className="text-[15px] text-muted">Nenhum cupom novo no momento — volte em breve.</p>
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
        </section>

        {history.length > 0 && (
          <section className="flex flex-col gap-4">
            <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Cupons já resgatados</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {history.map((claim) => (
                <CouponCard
                  key={claim.id}
                  id={claim.id}
                  kind={claim.kind}
                  title={claim.title}
                  description={claim.description}
                  couponCode={claim.couponCode!}
                  validUntil={claim.validUntil}
                  business={claim.business}
                  claimedAt={claim.claimedAt}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
