"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { categories } from "@/data/businesses";
import { registerBusiness } from "@/lib/actions/register-business";
import { Link } from "@/i18n/navigation";
import type { TowerOption } from "@/app/[locale]/cadastro/page";

const realCategories = categories.filter((c) => c !== "Todas");

type ServiceDraft = { name: string; description: string };

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
  logoUrl: string;
  coverPhotoUrl: string;
  instagram: string;
  websiteUrl: string;
  openingHours: string;
  services: ServiceDraft[];
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
  logoUrl: "",
  coverPhotoUrl: "",
  instagram: "",
  websiteUrl: "",
  openingHours: "",
  services: [{ name: "", description: "" }],
  termsAccepted: false,
  privacyAccepted: false,
  registrationPolicyAccepted: false,
  imageUsageAuthorized: false,
  addressConfirmed: false,
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

export function RegisterWizard({ towers }: { towers: TowerOption[] }) {
  const t = useTranslations("RegisterWizard");
  const tCategories = useTranslations("categories");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedTower = towers.find((t) => t.id === form.towerId);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateService(index: number, patch: Partial<ServiceDraft>) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
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
    }
    return null;
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
    setError(null);
    startTransition(async () => {
      const result = await registerBusiness(form);
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
        <p className="mt-3 text-[15px] text-muted">{t("doneDescription")}</p>
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
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">{t("step1Eyebrow")}</p>
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
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">{t("step2Eyebrow")}</p>
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
            <p className="text-[13px] text-muted">{t("towerAddress", { address: selectedTower.address })}</p>
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
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">{t("step3Eyebrow")}</p>
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
          <div>
            <span className={labelClass}>{t("labels.services")}</span>
            <div className="mt-2 flex flex-col gap-3">
              {form.services.map((service, index) => (
                <div key={index} className="rounded-xl border border-border p-3">
                  <input
                    className={inputClass}
                    placeholder={t("labels.serviceName")}
                    value={service.name}
                    onChange={(e) => updateService(index, { name: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder={t("labels.serviceDescription")}
                    value={service.description}
                    onChange={(e) => updateService(index, { description: e.target.value })}
                  />
                </div>
              ))}
              {form.services.length < 3 && (
                <button
                  type="button"
                  onClick={() => update("services", [...form.services, { name: "", description: "" }])}
                  className="self-start text-[13px] font-medium text-primary"
                >
                  {t("addService")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">{t("step4Eyebrow")}</p>
          <label className="flex items-start gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.addressConfirmed}
              onChange={(e) => update("addressConfirmed", e.target.checked)}
            />
            {t("consent.address")}
          </label>
          <label className="flex items-start gap-3 text-[14px] text-foreground">
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
          <label className="flex items-start gap-3 text-[14px] text-foreground">
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
          <label className="flex items-start gap-3 text-[14px] text-foreground">
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
          <label className="flex items-start gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.imageUsageAuthorized}
              onChange={(e) => update("imageUsageAuthorized", e.target.checked)}
            />
            {t("consent.imageUsage")}
          </label>
        </div>
      )}

      {error && <p className="mt-6 text-[13px] text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="neu rounded-full px-6 py-3 text-[14px] font-medium text-foreground"
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
            className="neu-primary rounded-full px-6 py-3 text-[14px] font-medium text-white"
          >
            {t("buttons.continue")}
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="neu-primary rounded-full px-6 py-3 text-[14px] font-medium text-white disabled:opacity-60"
          >
            {isPending ? t("buttons.submitting") : t("buttons.submit")}
          </button>
        )}
      </div>
    </div>
  );
}
