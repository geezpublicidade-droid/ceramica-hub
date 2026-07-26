"use client";

import { useState, useTransition } from "react";
import { requestDataExport, requestDataDeletion } from "@/lib/actions/lgpd";

export function PrivacyControls({ isOwner }: { isOwner: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [reason, setReason] = useState("");

  function handleExport() {
    setMessage(null);
    startTransition(async () => {
      const result = await requestDataExport();
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "meus-dados-ceramica-hub.json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleRequestDeletion() {
    setMessage(null);
    startTransition(async () => {
      const result = await requestDataDeletion(reason);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setShowDeleteForm(false);
      setMessage("Solicitação enviada. Nossa equipe vai revisar e confirmar por e-mail.");
    });
  }

  return (
    <div className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Privacidade e dados</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleExport}
          className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
        >
          Exportar meus dados
        </button>
        {isOwner && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowDeleteForm((v) => !v)}
            className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
          >
            Solicitar exclusão dos meus dados
          </button>
        )}
      </div>

      {showDeleteForm && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[12px] text-muted">
            Sua empresa e todos os dados associados (fotos, serviços, promoções, faturas) serão excluídos
            permanentemente após revisão da nossa equipe.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            rows={2}
            className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[13px] text-foreground outline-none"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleRequestDeletion}
            className="self-start rounded-full bg-red-600 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
          >
            Confirmar solicitação
          </button>
        </div>
      )}

      {message && <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-[13px] text-foreground">{message}</p>}
    </div>
  );
}
