"use client";

import { useState } from "react";
import { saveLandingConfig } from "@/lib/actions/landing-editor";
import { Field, SaveBar, TabIntro, inputClass, useSaver } from "../ui";
import type { TabProps } from "../types";

/** Informações principais: apresentação da empresa e itens da barra de confiança. */
export function MainTab({ data, target }: TabProps) {
  const { config } = data;
  const [form, setForm] = useState({
    aboutProblem: config.aboutProblem ?? "",
    aboutBenefit: config.aboutBenefit ?? "",
    aboutAudience: config.aboutAudience ?? "",
    differentials: config.aboutDifferentials.join("\n"),
    yearsInBusiness: config.yearsInBusiness?.toString() ?? "",
    responseTime: config.responseTime ?? "",
    byAppointment: config.byAppointment,
    professionalRegistry: config.professionalRegistry ?? "",
  });
  const { pending, message, run } = useSaver();
  const set = (key: keyof typeof form) => (value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  function save() {
    run(() =>
      saveLandingConfig(target, {
        aboutProblem: form.aboutProblem,
        aboutBenefit: form.aboutBenefit,
        aboutAudience: form.aboutAudience,
        aboutDifferentials: form.differentials.split("\n").map((line) => line.trim()).filter(Boolean),
        yearsInBusiness: form.yearsInBusiness === "" ? null : Number(form.yearsInBusiness),
        responseTime: form.responseTime,
        byAppointment: form.byAppointment,
        professionalRegistry: form.professionalRegistry,
      }),
    );
  }

  return (
    <div className="space-y-4">
      <TabIntro>Textos curtos convertem mais. Só aparece na página o que estiver preenchido.</TabIntro>
      <Field label="Que problema a empresa resolve?" hint="Até 400 caracteres.">
        <textarea rows={3} maxLength={400} value={form.aboutProblem} onChange={(e) => set("aboutProblem")(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Principal benefício">
        <textarea rows={2} maxLength={400} value={form.aboutBenefit} onChange={(e) => set("aboutBenefit")(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Para quem atendemos">
        <textarea rows={2} maxLength={300} value={form.aboutAudience} onChange={(e) => set("aboutAudience")(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Diferenciais" hint="Um por linha, no máximo 6.">
        <textarea rows={4} value={form.differentials} onChange={(e) => set("differentials")(e.target.value)} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Anos de atuação">
          <input type="number" min={0} max={200} value={form.yearsInBusiness} onChange={(e) => set("yearsInBusiness")(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Resposta rápida" hint='Ex.: "Atendimento ágil pelo WhatsApp"'>
          <input maxLength={80} value={form.responseTime} onChange={(e) => set("responseTime")(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Registro profissional" hint="Ex.: CRO-SP 12345 (quando aplicável)">
          <input maxLength={80} value={form.professionalRegistry} onChange={(e) => set("professionalRegistry")(e.target.value)} className={inputClass} />
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-3 text-[14px] font-medium">
          <input type="checkbox" checked={form.byAppointment} onChange={(e) => set("byAppointment")(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Atendimento com hora marcada
        </label>
      </div>
      <SaveBar pending={pending} message={message} onSave={save} />
    </div>
  );
}
