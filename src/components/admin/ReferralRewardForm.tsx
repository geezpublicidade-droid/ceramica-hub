"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAction } from "@/components/admin/useAdminAction";
import { grantReferralReward } from "@/lib/actions/admin-referrals";

/** Campo + botão para registrar a recompensa de uma indicação convertida. */
export function ReferralRewardForm({ referralId }: { referralId: string }) {
  const router = useRouter();
  const { error, isPending, run } = useAdminAction();
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ex.: 1 mês grátis"
          maxLength={300}
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-1.5 text-[14px]"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => grantReferralReward(referralId, note), () => router.refresh())}
          className="neu-primary rounded-full px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
        >
          Conceder
        </button>
      </div>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
