"use client";

import { useState, useTransition } from "react";
import { requestActionAction } from "@/lib/actions/action-requests";

/** Pede a renovação da posição à equipe (vira um chamado de suporte rotulado). */
export function RenewPlacementButton({ message }: { message: string }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function request() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await requestActionAction({ type: "renovar_destaque_categoria", message });
        setFeedback(
          result.success
            ? { ok: true, text: "Pedido enviado! Nossa equipe responde pelo Suporte." }
            : { ok: false, text: result.error },
        );
      } catch {
        setFeedback({ ok: false, text: "Não foi possível enviar agora. Tente de novo." });
      }
    });
  }

  if (feedback?.ok) return <p className="text-[14px] text-emerald-700">{feedback.text}</p>;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={request}
        disabled={isPending}
        className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enviando…" : "Quero renovar"}
      </button>
      {feedback && <p className="text-[14px] text-red-700">{feedback.text}</p>}
    </div>
  );
}
