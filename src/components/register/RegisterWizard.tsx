"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { categories } from "@/data/businesses";
import { registerBusiness, uploadComprovante } from "@/lib/actions/register-business";
import { Link } from "@/i18n/navigation";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import type { TowerOption } from "@/app/[locale]/cadastro/page";

const realCategories = categories.filter((c) => c !== "Todas");

type FormState = {
  name: string;
  responsibleName: string;
  email: string;
  password: string;
  phone: string;
  document: string;
  category: string;
  shortDescription: string;
  towerId: string;
  floor: string;
  roomNumber: string;
  comprovantePath: string;
  comprovanteFileName: string;
  logoUrl: string;
  coverPhotoUrl: string;
  instagram: string;
  websiteUrl: string;
  openingHours: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  registrationPolicyAccepted: boolean;
  imageUsageAuthorized: boolean;
  addressConfirmed: boolean;
};

const initialState: FormState = {
  name: "",
  responsibleName: "",
  email: "",
  password: "",
  phone: "",
  document: "",
  category: "",
  shortDescription: "",
  towerId: "",
  floor: "",
  roomNumber: "",
  comprovantePath: "",
  comprovanteFileName: "",
  logoUrl: "",
  coverPhotoUrl: "",
  instagram: "",
  websiteUrl: "",
  openingHours: "",
  termsAccepted: false,
  privacyAccepted: false,
  registrationPolicyAccepted: false,
  imageUsageAuthorized: false,
  addressConfirmed: false,
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[17px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[15px] font-medium text-foreground";

export function RegisterWizard({ towers }: { towers: TowerOption[] }) {
  const t = useTranslations("RegisterWizard");
  const tCategories = useTranslations("categories");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [comprovanteUploading, setComprovanteUploading] = useState(false);
  const [comprovanteError, setComprovanteError] = useState<string | null>(null);

  const selectedTower = towers.find((t) => t.id === form.towerId);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!form.name.trim()) return t("errors.name");
      if (!form.responsibleName.trim()) return t("errors.responsibleName");
      if (!form.email.trim()) return t("errors.email");
      if (form.password.length < 8) return t("errors.password");
      if (!form.phone.trim()) return t("errors.phone");
      if (!form.category) return t("errors.category");
    }
    if (current === 2) {
      if (!form.towerId) return t("errors.tower");
      if (!form.floor.trim()) return t("errors.floor");
      if (!form.roomNumber.trim()) return t("errors.roomNumber");
      if (!form.comprovantePath) return t("errors.comprovante");
    }
    return null;
  }

  async function handleComprovanteChange(file: File | null) {
    if (!file) return;
    setComprovanteError(null);
    setComprovanteUploading(true);
    const uploadForm = new FormData();
    uploadForm.set("file", file);
    const result = await uploadComprovante(uploadForm);
    setComprovanteUploading(false);
    if (!result.success) {
      setComprovanteError(result.error);
      return;
    }
    update("comprovantePath", result.path);
    update("comprovanteFileName", file.name);
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    if (!form.termsAccepted || !form.privacyAccepted || !form.registrationPolicyAccepted || !form.addressConfirmed) {
      setError(t("errors.consent"));
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError(t("errors.turnstile"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await registerBusiness({ ...form, turnstileToken });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-border bg-white/70 px-8 py-12 text-center">
        <h2 className="text-[1.4rem] font-semibold text-foreground">{t("doneTitle")}</h2>
        <p className="mt-3 text-[17px] text-muted">{t("doneDescription")}</p>
        <Link
          href="/preview"
          className="neu-primary mt-8 inline-block rounded-full px-7 py-3 text-[16px] font-medium text-white"
        >
          {t("backToSite")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-white/70 px-6 py-8 sm:px-8">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{t("step1Eyebrow")}</p>
          <label>
            <span className={labelClass}>{t("labels.name")}</span>
            <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>{t("labels.responsibleName")}</span>
            <input
              className={inputClass}
              value={form.responsibleName}
              onChange={(e) => update("responsibleName", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.email")}</span>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.password")}</span>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={t("placeholders.password")}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.phone")}</span>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder={t("placeholders.phone")}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.document")}</span>
            <input
              className={inputClass}
              value={form.document}
              onChange={(e) => update("document", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.category")}</span>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">{t("placeholders.categorySelect")}</option>
              {realCategories.map((c) => (
                <option key={c} value={c}>
                  {tCategories(c)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>{t("labels.shortDescription")}</span>
            <textarea
              className={inputClass}
              rows={3}
              value={form.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{t("step2Eyebrow")}</p>
          <label>
            <span className={labelClass}>{t("labels.tower")}</span>
            <select
              className={inputClass}
              value={form.towerId}
              onChange={(e) => update("towerId", e.target.value)}
            >
              <option value="">{t("placeholders.towerSelect")}</option>
              {towers.map((tower) => (
                <option key={tower.id} value={tower.id}>
                  {tower.name}
                </option>
              ))}
            </select>
          </label>
          {selectedTower && (
            <p className="text-[15px] text-muted">{t("towerAddress", { address: selectedTower.address })}</p>
          )}
          <label>
            <span className={labelClass}>{t("labels.floor")}</span>
            <input className={inputClass} value={form.floor} onChange={(e) => update("floor", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>{t("labels.roomNumber")}</span>
            <input
              className={inputClass}
              value={form.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.comprovante")}</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className={inputClass}
              onChange={(e) => handleComprovanteChange(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1.5 text-[13px] text-muted">{t("comprovanteHint")}</p>
            {comprovanteUploading && <p className="mt-1 text-[13px] text-muted">{t("comprovanteUploading")}</p>}
            {form.comprovanteFileName && !comprovanteUploading && (
              <p className="mt-1 text-[13px] text-primary">{t("comprovanteSelected", { fileName: form.comprovanteFileName })}</p>
            )}
            {comprovanteError && <p className="mt-1 text-[13px] text-red-600">{comprovanteError}</p>}
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{t("step3Eyebrow")}</p>
          <p className="-mt-2 text-[14px] text-muted">
            {t("step3PlanNote")}{" "}
            <Link href="/planos" className="font-medium text-primary hover:underline">
              {t("step3PlanCta")}
            </Link>
          </p>
          <label>
            <span className={labelClass}>{t("labels.logoUrl")}</span>
            <input className={inputClass} value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>{t("labels.coverPhotoUrl")}</span>
            <input
              className={inputClass}
              value={form.coverPhotoUrl}
              onChange={(e) => update("coverPhotoUrl", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.instagram")}</span>
            <input
              className={inputClass}
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              placeholder={t("placeholders.instagram")}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.websiteUrl")}</span>
            <input
              className={inputClass}
              value={form.websiteUrl}
              onChange={(e) => update("websiteUrl", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t("labels.openingHours")}</span>
            <input
              className={inputClass}
              value={form.openingHours}
              onChange={(e) => update("openingHours", e.target.value)}
              placeholder={t("placeholders.openingHours")}
            />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{t("step4Eyebrow")}</p>
          <label className="flex items-start gap-3 text-[16px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.addressConfirmed}
              onChange={(e) => update("addressConfirmed", e.target.checked)}
            />
            {t("consent.address")}
          </label>
          <label className="flex items-start gap-3 text-[16px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.termsAccepted}
              onChange={(e) => update("termsAccepted", e.target.checked)}
            />
            {t.rich("consent.terms", {
              termsLink: (chunks: ReactNode) => (
                <Link href="/termos" target="_blank" className="text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </label>
          <label className="flex items-start gap-3 text-[16px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.privacyAccepted}
              onChange={(e) => update("privacyAccepted", e.target.checked)}
            />
            {t.rich("consent.privacy", {
              privacyLink: (chunks: ReactNode) => (
                <Link href="/privacidade" target="_blank" className="text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </label>
          <label className="flex items-start gap-3 text-[16px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.registrationPolicyAccepted}
              onChange={(e) => update("registrationPolicyAccepted", e.target.checked)}
            />
            {t.rich("consent.registrationPolicy", {
              registrationLink: (chunks: ReactNode) => (
                <Link href="/politica-de-cadastro" target="_blank" className="text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </label>
          <label className="flex items-start gap-3 text-[16px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.imageUsageAuthorized}
              onChange={(e) => update("imageUsageAuthorized", e.target.checked)}
            />
            {t("consent.imageUsage")}
          </label>
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>
      )}

      {error && <p className="mt-6 text-[15px] text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="neu rounded-full px-6 py-3 text-[16px] font-medium text-foreground"
          >
            {t("buttons.back")}
          </button>
        ) : (
          <span />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={goNext}
            className="neu-primary rounded-full px-6 py-3 text-[16px] font-medium text-white"
          >
            {t("buttons.continue")}
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="neu-primary rounded-full px-6 py-3 text-[16px] font-medium text-white disabled:opacity-60"
          >
            {isPending ? t("buttons.submitting") : t("buttons.submit")}
          </button>
        )}
      </div>
    </div>
  );
}
