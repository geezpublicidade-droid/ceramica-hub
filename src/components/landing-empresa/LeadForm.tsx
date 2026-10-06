"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { submitBusinessLead } from "@/lib/actions/business-leads";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { utmSourceFromSearch } from "@/lib/share-links";
import { track } from "@/lib/analytics";

type LeadFormProps = {
  businessId: string;
  businessName: string;
  services: { id: string; name: string }[];
};

/** utm_source > host do referrer (se for de fora do site) > "direto". */
function leadSource(): string {
  const utm = utmSourceFromSearch(window.location.search);
  if (utm) return utm;
  try {
    const host = new URL(document.referrer).hostname.replace(/^www./, "");
    return host && host !== window.location.hostname.replace(/^www./, "") ? host : "direto";
  } catch {
    return "direto";
  }
}

type Status = "idle" | "sending" | "success";

const fieldClass = "w-full rounded-md border border-black/15 bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

/** Formulário de pedido de contato: grava o lead vinculado à empresa, com consentimento LGPD e a origem da visita. */
export function LeadForm({ businessId, businessName, services }: LeadFormProps) {
  const t = useTranslations("LandingEmpresa");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError(null);

    const result = await submitBusinessLead({
      businessId,
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      serviceId: String(form.get("serviceId") ?? ""),
      message: String(form.get("message") ?? ""),
      consent: form.get("consent") === "on",
      source: leadSource(),
      pagePath: window.location.pathname,
      turnstileToken,
    }).catch(() => ({ success: false as const, error: t("leadError") }));

    if (result.success) {
      track({ name: "lead_form", form: `landing-${businessName}` });
      setStatus("success");
      return;
    }
    setError(result.error);
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <p role="status" className="rounded-md border border-whatsapp/30 bg-white p-5 text-[16px] font-medium text-foreground">
        {t("leadSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[14px] font-medium">
          {t("leadName")}
          <input name="name" required autoComplete="name" maxLength={120} className={`mt-1.5 ${fieldClass}`} />
        </label>
        <label className="block text-[14px] font-medium">
          {t("leadPhone")}
          <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className={`mt-1.5 ${fieldClass}`} />
        </label>
        <label className="block text-[14px] font-medium">
          {t("leadEmail")}
          <input name="email" type="email" autoComplete="email" maxLength={200} className={`mt-1.5 ${fieldClass}`} />
        </label>
        {services.length > 0 && (
          <label className="block text-[14px] font-medium">
            {t("leadService")}
            <select name="serviceId" defaultValue="" className={`mt-1.5 ${fieldClass}`}>
              <option value="">{t("leadServiceAny")}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="block text-[14px] font-medium">
        {t("leadMessage")}
        <textarea name="message" rows={3} maxLength={1000} className={`mt-1.5 ${fieldClass}`} />
      </label>
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-muted">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
        <span>{t("leadConsent", { name: businessName })}</span>
      </label>
      <TurnstileWidget onVerify={setTurnstileToken} />
      {error && (
        <p role="alert" className="text-[14px] font-medium text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "sending" ? t("leadSending") : t("leadSubmit")}
      </button>
    </form>
  );
}
