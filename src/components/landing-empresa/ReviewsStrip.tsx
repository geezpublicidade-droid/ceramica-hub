import { BadgeCheck, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ReviewForm } from "@/components/business/ReviewForm";
import { SECTION_TITLE, type LandingContext } from "./context";

const MAX_REVIEWS = 4;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className="h-4 w-4 text-amber-500" fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Depoimentos aprovados na moderação (business_reviews). Sem nenhum, só resta o convite para avaliar. */
export async function ReviewsStrip({ ctx }: { ctx: LandingContext }) {
  const t = await getTranslations("LandingEmpresa");
  const { reviews, reviewStats } = ctx.data;
  const dateFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });

  return (
    <section id="avaliacoes" className="container-page py-12 sm:py-16">
      {reviews.length > 0 && (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className={SECTION_TITLE}>{t("reviewsTitle")}</h2>
            <p className="flex items-center gap-2 text-[14px] text-foreground/75">
              <Stars rating={Math.round(reviewStats.average)} />
              <strong className="text-foreground">{reviewStats.average.toFixed(1)}</strong>({reviewStats.count})
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {reviews.slice(0, MAX_REVIEWS).map((review) => (
              <li key={review.id} className="rounded-md border border-black/[0.07] bg-white p-5">
                <Stars rating={review.rating} />
                <blockquote className="mt-3 text-[15.5px] leading-relaxed text-foreground/85">“{review.comment}”</blockquote>
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
                  <strong className="text-foreground">{review.memberDisplayName}</strong>
                  <span className="inline-flex items-center gap-1 text-primary">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    {t("reviewVerified")}
                  </span>
                  <span className="text-muted">{dateFormat.format(new Date(review.createdAt))}</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <details className={reviews.length > 0 ? "mt-6" : ""}>
        <summary className="cursor-pointer text-[14px] font-semibold text-primary hover:underline">{t("reviewInvite")}</summary>
        <div className="mt-4">
          <ReviewForm businessId={ctx.business.id} />
        </div>
      </details>
    </section>
  );
}
