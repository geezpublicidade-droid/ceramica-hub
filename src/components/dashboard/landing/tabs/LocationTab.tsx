"use client";

import { useState } from "react";
import { saveLandingConfig } from "@/lib/actions/landing-editor";
import { DAY_KEYS, type DayKey } from "@/lib/landing/hours";
import { Field, SaveBar, TabIntro, inputClass, useSaver } from "../ui";
import type { TabProps } from "../types";

const DAY_LABELS: Record<DayKey, string> = { mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta", fri: "Sexta", sat: "Sábado", sun: "Domingo" };

type DayRow = { open: boolean; from: string; to: string };

/** Localização e horários: horário por dia (alimenta "Aberto agora"), estacionamento, acessibilidade, referência e redes. */
export function LocationTab({ data, target }: TabProps) {
  const { config } = data;
  const [days, setDays] = useState<Record<DayKey, DayRow>>(() =>
    Object.fromEntries(
      DAY_KEYS.map((day) => {
        const range = config.openingSchedule?.[day]?.[0];
        return [day, { open: Boolean(range), from: range?.[0] ?? "09:00", to: range?.[1] ?? "18:00" }];
      }),
    ) as Record<DayKey, DayRow>,
  );
  const [form, setForm] = useState({
    parkingInfo: config.parkingInfo ?? "",
    accessibilityInfo: config.accessibilityInfo ?? "",
    referencePoint: config.referencePoint ?? "",
    facebookUrl: config.facebookUrl ?? "",
    tiktokUrl: config.tiktokUrl ?? "",
    youtubeUrl: config.youtubeUrl ?? "",
  });
  const { pending, message, run } = useSaver();
  const setDay = (day: DayKey, patch: Partial<DayRow>) => setDays((current) => ({ ...current, [day]: { ...current[day], ...patch } }));

  function save() {
    const schedule = Object.fromEntries(DAY_KEYS.map((day) => [day, days[day].open ? [[days[day].from, days[day].to]] : []]));
    const anyOpen = DAY_KEYS.some((day) => days[day].open);
    run(() => saveLandingConfig(target, { ...form, openingSchedule: anyOpen ? schedule : null }));
  }

  return (
    <div className="space-y-5">
      <TabIntro>O endereço, a torre, o andar e a sala vêm do cadastro da empresa. Aqui você completa os horários e as informações de visita.</TabIntro>
      <fieldset>
        <legend className="text-[14px] font-medium">Horário de funcionamento</legend>
        <div className="mt-2 divide-y divide-border rounded-lg border border-border bg-white">
          {DAY_KEYS.map((day) => (
            <div key={day} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
              <label className="flex w-32 items-center gap-2 text-[14px] font-medium">
                <input type="checkbox" checked={days[day].open} onChange={(e) => setDay(day, { open: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                {DAY_LABELS[day]}
              </label>
              {days[day].open ? (
                <div className="flex items-center gap-2 text-[14px]">
                  <input type="time" value={days[day].from} onChange={(e) => setDay(day, { from: e.target.value })} className="rounded-md border border-border px-2 py-1" />
                  <span>às</span>
                  <input type="time" value={days[day].to} onChange={(e) => setDay(day, { to: e.target.value })} className="rounded-md border border-border px-2 py-1" />
                </div>
              ) : (
                <span className="text-[14px] text-muted">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estacionamento">
          <input maxLength={140} value={form.parkingInfo} onChange={(e) => setForm({ ...form, parkingInfo: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Acessibilidade">
          <input maxLength={140} value={form.accessibilityInfo} onChange={(e) => setForm({ ...form, accessibilityInfo: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Ponto de referência">
          <input maxLength={140} value={form.referencePoint} onChange={(e) => setForm({ ...form, referencePoint: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Facebook" hint="Link completo com https://">
          <input value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} className={inputClass} />
        </Field>
        <Field label="TikTok">
          <input value={form.tiktokUrl} onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })} className={inputClass} />
        </Field>
        <Field label="YouTube">
          <input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} className={inputClass} />
        </Field>
      </div>
      <SaveBar pending={pending} message={message} onSave={save} />
    </div>
  );
}
