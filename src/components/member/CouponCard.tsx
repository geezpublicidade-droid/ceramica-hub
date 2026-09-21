"use client";

import { useState, useTransition } from "react";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { IconCoupon } from "@/components/dashboard/nav-icons";
import { logCouponRevealedAction } from "@/lib/actions/member-coupons";
import type { Business } from "@/data/businesses";
import type { BenefitKind } from "@/data/benefits";

const KIND_LABEL: Record<BenefitKind, string> = {
  desconto: "Desconto",
  cortesia: "Cortesia",
  combo: "Combo",
  "avaliacao-gratis": "Avaliação grátis",
  "beneficio-funcionario": "Para funcionários",
  promocao: "Promoção",
};

export function CouponCard({
  id,
  kind,
  title,
  description,
  couponCode,
  validUntil,
  business,
  claimedAt,
}: {
  id: string;
  kind: BenefitKind;
  title: string;
  description: string;
  couponCode: string;
  validUntil?: string;
  business: Pick<Business, "id" | "name" | "slug" | "initials" | "logo">;
  /** Presente = card de histórico (já revelado antes, sem botão "Revelar"
   * de novo, mostra quando foi resgatado no lugar do CTA). */
  claimedAt?: string;
}) {
  const [revealed, setRevealed] = useState(Boolean(claimedAt));
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    startTransition(() => {
      void logCouponRevealedAction(id, business.id);
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex: contexto não seguro) -- código já está visível na tela, sem fallback necessário
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/40 bg-white/80 p-5">
      <div className="flex items-start gap-4">
        <BusinessAvatar
          business={business}
          className="h-12 w-12 shrink-0 rounded-full bg-white"
          textClassName="text-[15px] font-semibold text-foreground"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">
              {KIND_LABEL[kind]}
            </span>
            <p className="truncate text-[14px] text-muted">{business.name}</p>
          </div>
          <p className="mt-1.5 text-[16px] font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">{description}</p>
          {validUntil && (
            <p className="mt-1.5 text-[12px] text-muted">
              Válido até{" "}
              {new Date(validUntil).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-primary/30 pt-4">
        {revealed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-xl bg-primary/10 px-4 py-2.5 font-mono text-[16px] font-semibold tracking-wider text-primary">
                {couponCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            {claimedAt && (
              <p className="text-[12px] text-muted">
                Resgatado em{" "}
                {new Date(claimedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={reveal}
            className="neu-primary flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium text-white"
          >
            <IconCoupon className="h-5 w-5" />
            Revelar cupom
          </button>
        )}
      </div>
    </div>
  );
}
