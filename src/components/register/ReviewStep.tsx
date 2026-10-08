"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { completenessItems, completenessScore, type ProfileDraft } from "@/lib/profile/draft";
import { StepHeader } from "./wizard-ui";

export type Consents = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  registrationPolicyAccepted: boolean;
  imageUsageAuthorized: boolean;
  addressConfirmed: boolean;
  marketingOptIn: boolean;
};

type Props = {
  draft: ProfileDraft;
  consents: Consents;
  setConsent: (key: keyof Consents, value: boolean) => void;
  onTurnstile: (token: string | null) => void;
};

function Check({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-[16px] text-foreground">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function Completeness({ draft }: { draft: ProfileDraft }) {
  const score = completenessScore(draft);
  const missing = completenessItems(draft).filter((item) => !item.done);
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[16px] font-semibold text-foreground">Perfil {score}% completo</span>
        <span className="text-[13px] text-muted">Você pode completar depois no painel</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
      </div>
      {missing.length > 0 && <p className="mt-3 text-[14px] text-muted">Falta: {missing.map((item) => item.label.toLowerCase()).join(", ")}.</p>}
    </div>
  );
}

/** Última etapa: quanto do perfil está pronto + aceites obrigatórios e verificação anti-robô. */
export function ReviewStep({ draft, consents, setConsent, onTurnstile }: Props) {
  const t = useTranslations("RegisterWizard");
  const legal = (key: "terms" | "privacy" | "registrationPolicy", href: string, tag: string) =>
    t.rich(`consent.${key}`, { [tag]: (chunks: ReactNode) => <Link href={href} target="_blank" className="text-primary underline">{chunks}</Link> });

  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 7 · Revisão" title="Quase lá" />
      <Completeness draft={draft} />
      <Check checked={consents.addressConfirmed} onChange={(v) => setConsent("addressConfirmed", v)}>{t("consent.address")}</Check>
      <Check checked={consents.termsAccepted} onChange={(v) => setConsent("termsAccepted", v)}>{legal("terms", "/termos", "termsLink")}</Check>
      <Check checked={consents.privacyAccepted} onChange={(v) => setConsent("privacyAccepted", v)}>{legal("privacy", "/privacidade", "privacyLink")}</Check>
      <Check checked={consents.registrationPolicyAccepted} onChange={(v) => setConsent("registrationPolicyAccepted", v)}>{legal("registrationPolicy", "/politica-de-cadastro", "registrationLink")}</Check>
      <Check checked={consents.imageUsageAuthorized} onChange={(v) => setConsent("imageUsageAuthorized", v)}>{t("consent.imageUsage")}</Check>
      <Check checked={consents.marketingOptIn} onChange={(v) => setConsent("marketingOptIn", v)}>{t("consent.marketing")}</Check>
      <TurnstileWidget onVerify={onTurnstile} />
    </div>
  );
}
