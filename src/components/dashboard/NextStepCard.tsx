import Link from "next/link";
import type { NextStepRecommendation } from "@/lib/services/presence-score";

export function NextStepCard({ recommendation }: { recommendation: NextStepRecommendation }) {
  if (!recommendation) {
    return (
      <div className="glass-light rounded-3xl p-6">
        <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Próximo passo</p>
        <p className="mt-3 text-[17px] font-medium text-foreground">
          Seu perfil está completo — continue divulgando!
        </p>
      </div>
    );
  }

  return (
    <div className="gradient-terracotta-animated rounded-3xl p-6 text-white">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-white/70">
        Próximo passo recomendado
      </p>
      <p className="mt-3 text-[17px] font-medium">{recommendation.message}</p>
      <Link
        href={recommendation.actionHref}
        className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-primary"
      >
        {recommendation.actionLabel}
      </Link>
    </div>
  );
}
