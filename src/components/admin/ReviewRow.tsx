"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { updateReviewStatus, deleteReview } from "@/lib/actions/admin-reviews";
import type { BusinessReviewAdminRow, ReviewStatus } from "@/lib/services/reviews";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado (visível no site)",
  rejeitado: "Rejeitado",
};

const STATUSES = Object.keys(STATUS_LABEL) as ReviewStatus[];

export function ReviewRow({ review }: { review: BusinessReviewAdminRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold text-foreground">{review.businessName}</p>
          <p className="text-[13px] text-muted">
            {review.memberFullName} · {review.memberEmail}
          </p>
          <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="h-3.5 w-3.5" fill={n <= review.rating ? "var(--primary)" : "none"} stroke="var(--primary)" strokeWidth={1.5} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
            value={review.status}
            disabled={isPending}
            onChange={(e) => startTransition(() => void updateReviewStatus(review.id, e.target.value as ReviewStatus))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void deleteReview(review.id))}
            className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
          >
            Excluir
          </button>
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-foreground/85">{review.comment}</p>
    </div>
  );
}
