"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateCouponAction } from "@/lib/actions/coupon-validation";

type Feedback = { ok: true; text: string } | { ok: false; text: string };

/** Campo para a empresa validar um cupom: o QR Code abre esta página com o código já preenchido. */
export function CouponValidator({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await validateCouponAction(token);
      if (!result.success) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setFeedback({ ok: true, text: `Cupom “${result.claim.benefitTitle}” de ${result.claim.memberName} validado.` });
      setToken("");
      router.replace("/dashboard/cupons");
    });
  }

  return (
    <section className="glass-light rounded-3xl p-6">
      <h2 className="text-[18px] font-semibold text-foreground">Validar cupom</h2>
      <p className="mt-1 text-[14px] text-muted">Leia o QR Code do cliente com a câmera do celular ou cole o código abaixo.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Código do QR Code"
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 font-mono text-[14px]"
        />
        <button
          type="button"
          onClick={validate}
          disabled={isPending || !token.trim()}
          className="neu-primary rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Validando…" : "Validar"}
        </button>
      </div>
      {feedback && <p className={`mt-3 text-[14px] ${feedback.ok ? "text-green-700" : "text-red-600"}`}>{feedback.text}</p>}
    </section>
  );
}
