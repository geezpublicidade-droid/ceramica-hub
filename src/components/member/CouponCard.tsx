"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { IconCoupon } from "@/components/dashboard/nav-icons";
import { claimCouponAction } from "@/lib/actions/member-coupons";
import { claimValidationUrl, type ClaimStatus } from "@/lib/services/coupon-token";
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

type Claim = { code: string; token: string; status: ClaimStatus; claimedAt?: string };

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** QR Code que a empresa lê com a câmera do celular: abre o painel dela já com o cupom para validar. */
function ClaimQr({ token }: { token: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(claimValidationUrl(token), { margin: 1, width: 192 })
      .then((url) => !cancelled && setDataUrl(url))
      .catch((error) => console.error("[coupons] falha ao gerar QR:", error));
    return () => {
      cancelled = true;
    };
  }, [token]);
  // eslint-disable-next-line @next/next/no-img-element
  return dataUrl ? <img src={dataUrl} alt="QR Code para validar o cupom" width={160} height={160} className="rounded-xl bg-white p-1" /> : null;
}

export function CouponCard({
  id,
  kind,
  title,
  description,
  validUntil,
  business,
  claim: initialClaim,
}: {
  /** Id do benefício. */
  id: string;
  kind: BenefitKind;
  title: string;
  description: string;
  validUntil?: string;
  business: Pick<Business, "id" | "name" | "slug" | "initials" | "logo">;
  /** Presente = cupom já revelado antes (histórico). Cupom novo não recebe o código: ele só chega ao revelar. */
  claim?: Claim;
}) {
  const [claim, setClaim] = useState<Claim | null>(initialClaim ?? null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reveal() {
    setError(null);
    startTransition(async () => {
      const result = await claimCouponAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setClaim({ code: result.code, token: result.token, status: result.status });
    });
  }

  async function copyCode() {
    if (!claim) return;
    try {
      await navigator.clipboard.writeText(claim.code);
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
          {validUntil && <p className="mt-1.5 text-[12px] text-muted">Válido até {formatDate(validUntil)}</p>}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-primary/30 pt-4">
        {claim ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-between gap-3">
              <span className="rounded-xl bg-primary/10 px-4 py-2.5 font-mono text-[16px] font-semibold tracking-wider text-primary">
                {claim.code}
              </span>
              <button type="button" onClick={copyCode} className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground">
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            {claim.status === "utilizado" ? (
              <p className="w-full text-[13px] font-medium text-green-700">Cupom utilizado ✓</p>
            ) : (
              <>
                <ClaimQr token={claim.token} />
                <p className="text-center text-[12px] text-muted">Mostre este QR Code na empresa para validar o cupom.</p>
              </>
            )}
            {claim.claimedAt && <p className="w-full text-[12px] text-muted">Resgatado em {formatDate(claim.claimedAt)}</p>}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={reveal}
              disabled={isPending}
              className="neu-primary flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-60"
            >
              <IconCoupon className="h-5 w-5" />
              {isPending ? "Revelando…" : "Revelar cupom"}
            </button>
            {error && <p className="mt-2 text-center text-[13px] text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
