"use client";

import { useState, useTransition } from "react";

export type AdminActionResult = { success: true } | { success: false; error: string };

/** Roda uma server action do admin dentro de uma transition e guarda a mensagem de erro, se houver. */
export function useAdminAction() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function run(action: () => Promise<AdminActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) setError(result.error);
      else onSuccess?.();
    });
  }
  return { error, isPending, run };
}
