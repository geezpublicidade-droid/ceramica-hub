"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { formatSchedule } from "@/lib/landing/hours";
import { registerBusiness } from "@/lib/actions/register-business";
import { Link } from "@/i18n/navigation";
import { emptyDraft, filledFields, mergeImport, type ProfileDraft } from "@/lib/profile/draft";
import type { TowerOption } from "@/app/[locale]/cadastro/page";
import { GoogleImportStep } from "./GoogleImportStep";
import { ReviewStep, type Consents } from "./ReviewStep";
import { AccountStep, BusinessStep, LocationStep, OfferStep, PresenceStep, type AccountState } from "./steps";

const TOTAL_STEPS = 7;

const initialAccount: AccountState = {
  responsibleName: "",
  email: "",
  password: "",
  phone: "",
  towerId: "",
  floor: "",
  roomNumber: "",
  comprovantePath: "",
  comprovanteFileName: "",
};

const initialConsents: Consents = {
  termsAccepted: false,
  privacyAccepted: false,
  registrationPolicyAccepted: false,
  imageUsageAuthorized: false,
  addressConfirmed: false,
  marketingOptIn: false,
};

const buttonBase = "rounded-full px-6 py-3 text-[16px] font-medium";

export function RegisterWizard({ towers }: { towers: TowerOption[] }) {
  const t = useTranslations("RegisterWizard");
  const [step, setStep] = useState(1);
  const [account, setAccountState] = useState(initialAccount);
  const [draft, setDraftState] = useState<ProfileDraft>(emptyDraft);
  const [consents, setConsents] = useState(initialConsents);
  const [fromGoogle, setFromGoogle] = useState<Set<keyof ProfileDraft>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const setAccount = <K extends keyof AccountState>(key: K, value: AccountState[K]) => setAccountState((prev) => ({ ...prev, [key]: value }));
  const setDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => setDraftState((prev) => ({ ...prev, [key]: value }));

  function applyImport(imported: Partial<ProfileDraft>) {
    setDraftState((prev) => mergeImport(prev, imported));
    setFromGoogle(new Set(filledFields(imported)));
    // o WhatsApp importado também vale para o login, se a pessoa ainda não digitou o dela
    if (imported.whatsapp) setAccountState((prev) => ({ ...prev, phone: prev.phone || imported.whatsapp! }));
    setStep(2);
  }

  function validateStep(current: number): string | null {
    if (current === 2) {
      if (!account.responsibleName.trim()) return t("errors.responsibleName");
      if (!account.email.trim()) return t("errors.email");
      if (account.password.length < 8) return t("errors.password");
      if (!account.phone.trim()) return t("errors.phone");
    }
    if (current === 3) {
      if (!draft.name.trim()) return t("errors.name");
      if (!draft.category) return t("errors.category");
    }
    if (current === 4) {
      if (!account.towerId) return t("errors.tower");
      if (!account.floor.trim()) return t("errors.floor");
      if (!account.roomNumber.trim()) return t("errors.roomNumber");
      if (!account.comprovantePath) return t("errors.comprovante");
    }
    return null;
  }

  function goNext() {
    const problem = validateStep(step);
    setError(problem);
    if (!problem) setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    if (!consents.termsAccepted || !consents.privacyAccepted || !consents.registrationPolicyAccepted || !consents.addressConfirmed) {
      return setError(t("errors.consent"));
    }
    if (turnstileRequired && !turnstileToken) return setError(t("errors.turnstile"));
    setError(null);
    const profile = { ...draft, whatsapp: draft.whatsapp || account.phone };
    startTransition(async () => {
      const result = await registerBusiness({
        ...account,
        ...consents,
        name: draft.name,
        category: draft.category,
        document: draft.document,
        shortDescription: draft.shortDescription,
        logoUrl: draft.logoUrl,
        coverPhotoUrl: draft.coverPhotoUrl,
        instagram: draft.instagram,
        websiteUrl: draft.websiteUrl,
        openingHours: draft.schedule ? formatSchedule(draft.schedule).join(" · ") : draft.openingHoursText,
        turnstileToken,
        profile,
        importedFromGoogle: Boolean(draft.googlePlaceId),
      });
      if (result.success) setDone(true);
      else setError(result.error);
    });
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-border bg-white/70 px-8 py-12 text-center">
        <h2 className="text-[1.4rem] font-semibold text-foreground">{t("doneTitle")}</h2>
        <p className="mt-3 text-[17px] text-muted">{t("doneDescription")}</p>
        <Link href="/" className={`neu-primary mt-8 inline-block text-white ${buttonBase}`}>
          {t("backToSite")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-white/70 px-6 py-8 sm:px-8">
      <div className="mb-8 flex items-center gap-2" aria-label={`Etapa ${step} de ${TOTAL_STEPS}`}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {step === 1 && <GoogleImportStep imported={Boolean(draft.googlePlaceId)} onImported={applyImport} />}
      {step === 2 && <AccountStep account={account} setAccount={setAccount} draft={draft} setDraft={setDraft} />}
      {step === 3 && <BusinessStep draft={draft} setDraft={setDraft} fromGoogle={fromGoogle} />}
      {step === 4 && <LocationStep account={account} setAccount={setAccount} draft={draft} setDraft={setDraft} fromGoogle={fromGoogle} towers={towers} />}
      {step === 5 && <PresenceStep draft={draft} setDraft={setDraft} fromGoogle={fromGoogle} />}
      {step === 6 && <OfferStep draft={draft} setDraft={setDraft} />}
      {step === 7 && <ReviewStep draft={draft} consents={consents} setConsent={(key, value) => setConsents((prev) => ({ ...prev, [key]: value }))} onTurnstile={setTurnstileToken} />}

      {error && <p className="mt-6 text-[15px] text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between gap-4">
        {step > 1 ? (
          <button type="button" onClick={goBack} className={`neu text-foreground ${buttonBase}`}>
            {t("buttons.back")}
          </button>
        ) : (
          <button type="button" onClick={goNext} className={`neu text-foreground ${buttonBase}`}>
            Pular e preencher à mão
          </button>
        )}
        {step < TOTAL_STEPS ? (
          step > 1 && (
            <button type="button" onClick={goNext} className={`neu-primary text-white ${buttonBase}`}>
              {t("buttons.continue")}
            </button>
          )
        ) : (
          <button type="button" disabled={isPending} onClick={handleSubmit} className={`neu-primary text-white disabled:opacity-60 ${buttonBase}`}>
            {isPending ? t("buttons.submitting") : t("buttons.submit")}
          </button>
        )}
      </div>
    </div>
  );
}
