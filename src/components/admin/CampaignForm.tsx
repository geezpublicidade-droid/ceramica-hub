"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMarketingCampaignAction, updateMarketingCampaignAction } from "@/lib/actions/marketing-campaigns";
import type { MarketingCampaign, MarketingCampaignInput } from "@/lib/services/marketing-campaigns";
import { CONTENT_CHANNEL_LABEL, type ContentChannel } from "@/lib/services/content-calendar";
import type { AssignableAdmin } from "@/lib/services/admins";
import type { CompanyListItem } from "@/lib/services/companies";
import type { Audience } from "@/lib/services/marketing-audiences";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";
const CHANNEL_OPTIONS = Object.entries(CONTENT_CHANNEL_LABEL) as [ContentChannel, string][];

type FormState = {
  name: string;
  objective: string;
  businessId: string;
  audienceId: string;
  startsOn: string;
  endsOn: string;
  budget: string;
  channels: ContentChannel[];
  ownerAdminId: string;
};

export type CampaignFormOptions = {
  admins: AssignableAdmin[];
  companies: CompanyListItem[];
  audiences: Audience[];
};

function initialState(campaign: MarketingCampaign | undefined): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: campaign?.name ?? "",
    objective: campaign?.objective ?? "",
    businessId: campaign?.businessId ?? "",
    audienceId: campaign?.audienceId ?? "",
    startsOn: campaign?.startsOn ?? today,
    endsOn: campaign?.endsOn ?? today,
    budget: campaign?.budgetCents != null ? (campaign.budgetCents / 100).toFixed(2).replace(".", ",") : "",
    channels: campaign?.channels ?? [],
    ownerAdminId: campaign?.ownerAdminId ?? "",
  };
}

/** "1.500,50" ou "1500.5" -> centavos; vazio -> null; inválido -> NaN. */
function parseBudgetCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  return Math.round(Number(normalized) * 100);
}

function toInput(form: FormState): MarketingCampaignInput {
  return {
    name: form.name,
    objective: form.objective || null,
    businessId: form.businessId || null,
    audienceId: form.audienceId || null,
    startsOn: form.startsOn,
    endsOn: form.endsOn,
    budgetCents: parseBudgetCents(form.budget),
    channels: form.channels,
    ownerAdminId: form.ownerAdminId || null,
  };
}

function SelectField({
  label,
  value,
  onChange,
  emptyLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CampaignForm({ campaign, options }: { campaign?: MarketingCampaign; options: CampaignFormOptions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(Boolean(campaign));
  const [form, setForm] = useState<FormState>(() => initialState(campaign));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleChannel(channel: ContentChannel) {
    set("channels", form.channels.includes(channel) ? form.channels.filter((c) => c !== channel) : [...form.channels, channel]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input = toInput(form);
    if (Number.isNaN(input.budgetCents)) {
      setError("Orçamento inválido.");
      return;
    }
    startTransition(async () => {
      try {
        const result = campaign
          ? await updateMarketingCampaignAction(campaign.id, input)
          : await createMarketingCampaignAction(input);
        if (!result.success) {
          setError(result.error);
          return;
        }
        if (!campaign) {
          setForm(initialState(undefined));
          setOpen(false);
        }
        router.refresh();
      } catch {
        setError("Não foi possível salvar agora. Tente de novo.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="neu-primary self-start rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
      >
        + Nova campanha
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">
        {campaign ? "Editar campanha" : "Nova campanha"}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClass}>Nome *</span>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Objetivo</span>
          <textarea className={inputClass} rows={2} value={form.objective} onChange={(e) => set("objective", e.target.value)} />
        </label>
        <SelectField
          label="Empresa relacionada"
          value={form.businessId}
          onChange={(value) => set("businessId", value)}
          emptyLabel="Campanha do próprio Hub"
          options={options.companies.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectField
          label="Público"
          value={form.audienceId}
          onChange={(value) => set("audienceId", value)}
          emptyLabel="Sem público definido"
          options={options.audiences.map((a) => ({ value: a.id, label: a.name }))}
        />
        <label>
          <span className={labelClass}>Início *</span>
          <input type="date" className={inputClass} value={form.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Término *</span>
          <input type="date" className={inputClass} value={form.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Orçamento (R$)</span>
          <input className={inputClass} inputMode="decimal" placeholder="0,00" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </label>
        <SelectField
          label="Responsável"
          value={form.ownerAdminId}
          onChange={(value) => set("ownerAdminId", value)}
          emptyLabel="Sem responsável"
          options={options.admins.map((a) => ({ value: a.id, label: a.email }))}
        />
        <fieldset className="sm:col-span-2">
          <legend className={labelClass}>Canais</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map(([value, label]) => {
              const checked = form.channels.includes(value);
              return (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] ${
                    checked ? "border-primary bg-primary/10 font-medium text-foreground" : "border-border bg-white text-muted"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleChannel(value)} />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      {error && <p className="text-[14px] text-danger">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="neu-primary rounded-full px-6 py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Salvar"}
        </button>
        {!campaign && (
          <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-6 py-2.5 text-[14px] text-muted">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
