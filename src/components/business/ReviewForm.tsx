"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { getMyReviewAction, submitReview } from "@/lib/actions/member-reviews";
import type { BusinessReview } from "@/lib/services/reviews";

const STATUS_LABEL: Record<BusinessReview["status"], string> = {
  pendente: "Sua avaliação está em análise antes de aparecer pra todo mundo.",
  aprovado: "Sua avaliação já está publicada. Editar aqui manda ela pra análise de novo.",
  rejeitado: "Sua última avaliação não foi aprovada. Você pode tentar de novo.",
};

/** Precisa estar logado como membro (Google) pra avaliar -- igual ao
 * FavoriteButton, manda pro login em vez de quebrar quando não logado. */
export function ReviewForm({ businessId }: { businessId: string }) {
  const [existing, setExisting] = useState<BusinessReview | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    getMyReviewAction(businessId).then((result) => {
      if (!active || !result || "loggedOut" in result) return;
      setExisting(result);
      setRating(result.rating);
      setComment(result.comment);
    }).finally(() => {
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [businessId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating === 0) {
      setFeedback("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await submitReview(businessId, rating, comment);
      if ("loggedOut" in result) {
        router.push(`/membro/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!result.success) {
        setFeedback(result.error);
        return;
      }
      setExisting({ id: existing?.id ?? "", businessId, memberId: "", memberDisplayName: "", rating, comment, status: "pendente", createdAt: new Date().toISOString() });
      setFeedback("Avaliação enviada! " + STATUS_LABEL.pendente);
    });
  }

  if (!loaded) return null;

  const shownRating = hoverRating || rating;

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <p className="text-[15px] font-semibold text-foreground">
        {existing ? "Sua avaliação" : "Avalie essa empresa"}
      </p>
      {existing && <p className="mt-1 text-[13px] text-muted">{STATUS_LABEL[existing.status]}</p>}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star
                className="h-6 w-6 transition-colors"
                fill={n <= shownRating ? "var(--primary)" : "none"}
                stroke="var(--primary)"
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi sua experiência com essa empresa..."
          required
          minLength={10}
          maxLength={1000}
          rows={3}
          className="neu w-full rounded-xl border-0 bg-transparent px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted"
        />

        {feedback && <p className="text-[13px] text-primary">{feedback}</p>}

        <button
          type="submit"
          disabled={pending}
          className="neu-primary self-start rounded-full px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
        >
          {existing ? "Atualizar avaliação" : "Enviar avaliação"}
        </button>
      </form>
    </div>
  );
}
