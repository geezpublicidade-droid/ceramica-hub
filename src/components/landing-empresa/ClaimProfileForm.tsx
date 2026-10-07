"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { submitProfileClaim } from "@/lib/actions/profile-claims";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const fieldClass = "mt-1.5 w-full rounded-md border border-black/15 bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

/** "Você representa esta empresa?" — abre um formulário curto que vai para a fila de análise do admin. */
export function ClaimProfileForm({ businessId, businessName }: { businessId: string; businessName: string }) {
  const t = useTranslations("LandingEmpresa");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError(null);
    const result = await submitProfileClaim({
      businessId,
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      role: String(form.get("role") ?? ""),
      message: String(form.get("message") ?? ""),
      consent: form.get("consent") === "on",
      turnstileToken,
    }).catch(() => ({ success: false as const, error: t("claimError") }));
    if (result.success) {
      setStatus("success");
      return;
    }
    setError(result.error);
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <p role="status" className="rounded-md border border-whatsapp/30 bg-white p-4 text-[15px] font-medium">
        {t("claimSuccess")}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-primary/90">
        {t("claimCta")}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left" noValidate aria-label={`${t("claimCta")} — ${businessName}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[14px] font-medium">
          {t("claimName")}
          <input name="name" required autoComplete="name" maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-[14px] font-medium">
          {t("claimEmail")}
          <input name="email" type="email" required autoComplete="email" maxLength={200} className={fieldClass} />
        </label>
        <label className="block text-[14px] font-medium">
          {t("claimPhone")}
          <input name="phone" type="tel" autoComplete="tel" maxLength={30} className={fieldClass} />
        </label>
        <label className="block text-[14px] font-medium">
          {t("claimRole")}
          <input name="role" maxLength={80} className={fieldClass} />
        </label>
      </div>
      <label className="block text-[14px] font-medium">
        {t("claimMessage")}
        <textarea name="message" rows={3} maxLength={800} className={fieldClass} />
      </label>
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-muted">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
        <span>{t("claimConsent")}</span>
      </label>
      <TurnstileWidget onVerify={setTurnstileToken} />
      {error && (
        <p role="alert" className="text-[14px] font-medium text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60">
        {status === "sending" ? t("claimSending") : t("claimSubmit")}
      </button>
    </form>
  );
}
