"use client";

import { useState, useTransition } from "react";
import { unsubscribeAction } from "@/lib/actions/email-marketing";

export function UnsubscribeButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<{ done: boolean; error: string | null }>({ done: false, error: null });

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await unsubscribeAction(token);
        setOutcome(result.success ? { done: true, error: null } : { done: false, error: result.error });
      } catch {
        setOutcome({ done: false, error: "Não foi possível concluir agora. Tente de novo." });
      }
    });
  }

  if (outcome.done) {
    return <p className="mt-6 text-[16px] font-medium text-success">Pronto! Sua inscrição foi cancelada.</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="neu-primary mt-6 rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Cancelando..." : "Confirmar cancelamento"}
      </button>
      {outcome.error && <p className="mt-3 text-[14px] text-danger">{outcome.error}</p>}
    </>
  );
}
