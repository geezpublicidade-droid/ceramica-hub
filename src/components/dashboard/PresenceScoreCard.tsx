import Link from "next/link";
import type { PresenceScore } from "@/lib/services/presence-score";

export function PresenceScoreCard({ score }: { score: PresenceScore }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[15px] font-medium text-foreground">Força do seu perfil</p>
        <p className="text-[15px] font-semibold text-foreground">{score.total} / 100</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${score.total}%` }}
        />
      </div>

      {score.missing.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {score.missing.map((criterion) => (
            <li key={criterion.key} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-muted">{criterion.actionLabel}</span>
              <Link href={criterion.actionHref} className="shrink-0 font-medium text-primary hover:underline">
                Resolver →
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[14px] text-muted">Seu perfil está completo em todos os critérios.</p>
      )}
    </div>
  );
}
