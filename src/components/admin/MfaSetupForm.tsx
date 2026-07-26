"use client";

import { useState, useTransition } from "react";
import { confirmMfaSetup } from "@/lib/actions/admin-mfa";

export function MfaSetupForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmMfaSetup(code);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Código de 6 dígitos"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-center text-[16px] tracking-[0.3em] text-foreground outline-none"
      />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="neu-primary rounded-full px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Confirmando..." : "Ativar verificação em duas etapas"}
      </button>
    </form>
  );
}
