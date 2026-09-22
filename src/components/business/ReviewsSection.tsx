import { Star } from "lucide-react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import { ReviewForm } from "@/components/business/ReviewForm";
import { getApprovedReviews, getReviewStats } from "@/lib/services/reviews";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}

function AverageStars({ average }: { average: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="h-4 w-4"
          fill={n <= Math.round(average) ? "var(--primary)" : "none"}
          stroke="var(--primary)"
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

/** Avaliações reais de membros logados (business_reviews, só status
 * "aprovado" aparece aqui) -- coluna(s) só com conteúdo real, nunca
 * preenchidas com depoimento inventado. Sem avaliação aprovada ainda,
 * esconde a vitrine mas mantém o convite pra avaliar. */
export async function ReviewsSection({ businessId }: { businessId: string }) {
  // Tolerante a "tabela ainda não existe" -- a migration 0042 pode ser
  // aplicada depois do deploy deste código (ver supabase/migrations/
  // 0042_business_reviews.sql). Sem isso, a página inteira da empresa quebra
  // nessa janela entre deploy e migration, não só a seção de avaliações.
  let reviews: Awaited<ReturnType<typeof getApprovedReviews>> = [];
  let stats = { average: 0, count: 0 };
  try {
    [reviews, stats] = await Promise.all([getApprovedReviews(businessId), getReviewStats(businessId)]);
  } catch {
    return null;
  }

  const testimonials: Testimonial[] = reviews.map((r) => ({
    text: r.comment,
    name: r.memberDisplayName,
    role: timeAgo(r.createdAt),
  }));

  const columns = [testimonials.slice(0, 3), testimonials.slice(3, 6), testimonials.slice(6, 9)].filter(
    (col) => col.length > 0,
  );

  return (
    <section className="bg-surface px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-muted">Avaliações</h2>
            {stats.count > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <AverageStars average={stats.average} />
                <span className="text-[15px] font-medium text-foreground">{stats.average.toFixed(1)}</span>
                <span className="text-[14px] text-muted">
                  ({stats.count} {stats.count === 1 ? "avaliação" : "avaliações"})
                </span>
              </div>
            )}
          </div>
        </div>

        {columns.length > 0 && (
          <div className="mt-8 flex max-h-[500px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
            {columns[0] && <TestimonialsColumn testimonials={columns[0]} duration={15} />}
            {columns[1] && <TestimonialsColumn testimonials={columns[1]} duration={19} className="hidden sm:block" />}
            {columns[2] && <TestimonialsColumn testimonials={columns[2]} duration={17} className="hidden lg:block" />}
          </div>
        )}

        {columns.length === 0 && (
          <p className="mt-6 text-[15px] text-muted">
            Ainda não há avaliações aprovadas pra essa empresa. Seja o primeiro a avaliar.
          </p>
        )}

        <div className="mt-8">
          <ReviewForm businessId={businessId} />
        </div>
      </div>
    </section>
  );
}
