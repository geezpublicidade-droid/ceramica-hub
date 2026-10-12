"use client";

import { useMemo, useState, useTransition } from "react";
import { bookAdSpace, uploadAdCreative } from "@/lib/actions/ad-store";
import { addDays, countDays, isRangeAvailable, priceForPeriod, validatePeriod } from "@/lib/ad-schedule";
import { formatCents, formatDateBR } from "@/lib/utils";
import type { StoreSpace } from "@/lib/services/ad-store";
import { PlacementLocator } from "@/components/dashboard/ads/PlacementLocator";
import { AvailabilityStrip } from "@/components/dashboard/ads/AvailabilityStrip";

type Creative = { url: string; error: string | null; busy: boolean };
const EMPTY: Creative = { url: "", error: null, busy: false };

const inputClass = "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[15px] text-foreground";

/** Um espaço à venda: onde aparece, medidas, disponibilidade, preço e o formulário de reserva. */
export function AdSpaceCard({ space, today, defaultUrl }: { space: StoreSpace; today: string; defaultUrl: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [start, setStart] = useState(space.nextFreeStart ?? "");
  const [end, setEnd] = useState(space.nextFreeStart ? addDays(space.nextFreeStart, space.minDays - 1) : "");
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [desktop, setDesktop] = useState<Creative>(EMPTY);
  const [mobile, setMobile] = useState<Creative>(EMPTY);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const held = useMemo(
    () => space.occupancy.filter((day) => day.free === 0).map((day) => ({ startsAt: day.date, endsAt: day.date })),
    [space.occupancy],
  );
  const periodError = start && end ? validatePeriod(start, end, today, { minDays: space.minDays, maxDays: space.maxDays, leadDays: space.leadDays }) : null;
  const available = start && end && !periodError ? isRangeAvailable(held, 1, start, end) : false;
  const days = start && end && end >= start ? countDays(start, end) : 0;
  const price = days > 0 ? priceForPeriod(space.monthlyPriceCents, days) : 0;
  const mobileSize = { width: space.mobileWidth ?? space.width, height: space.mobileHeight ?? space.height };

  async function pickFile(device: "desktop" | "mobile", file: File | undefined) {
    const set = device === "desktop" ? setDesktop : setMobile;
    if (!file) return;
    set({ url: "", error: null, busy: true });
    const body = new FormData();
    body.set("file", file);
    body.set("device", device);
    body.set("placementId", space.id);
    const result = await uploadAdCreative(body).catch(() => ({ success: false as const, error: "Falha no envio." }));
    set(result.success ? { url: result.url, error: null, busy: false } : { url: "", error: result.error, busy: false });
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await bookAdSpace({
        placementId: space.id,
        startsAt: start,
        endsAt: end,
        title,
        targetUrl,
        desktopImageUrl: desktop.url,
        mobileImageUrl: mobile.url,
      }).catch(() => ({ success: false as const, error: "Não foi possível reservar agora." }));
      setMessage(
        result.success
          ? { ok: true, text: "Reserva enviada! Siga com o pagamento pelo Suporte — assim que confirmarmos, a arte é aprovada e o anúncio entra no ar sozinho na data marcada." }
          : { ok: false, text: result.error },
      );
    });
  }

  const ready = available && title.trim().length >= 3 && desktop.url && mobile.url && targetUrl.trim();

  return (
    <article className="glass-card-light rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <PlacementLocator placementKey={space.key} label={space.name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-semibold text-foreground">{space.name}</h3>
          {space.locationLabel && <p className="text-[14px] font-medium text-primary">Aparece em: {space.locationLabel}</p>}
          {space.description && <p className="mt-1 text-[14px] text-muted">{space.description}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-3">
            <div><dt className="text-muted">Arte computador</dt><dd className="font-medium">{space.width}×{space.height}px</dd></div>
            <div><dt className="text-muted">Arte celular</dt><dd className="font-medium">{mobileSize.width}×{mobileSize.height}px</dd></div>
            <div><dt className="text-muted">Período</dt><dd className="font-medium">{space.minDays} a {space.maxDays} dias</dd></div>
            <div><dt className="text-muted">Vagas simultâneas</dt><dd className="font-medium">{space.capacity}</dd></div>
            <div><dt className="text-muted">Antecedência</dt><dd className="font-medium">{space.leadDays} dia(s)</dd></div>
            <div><dt className="text-muted">Valor</dt><dd className="font-semibold text-primary">{formatCents(space.monthlyPriceCents)}/mês</dd></div>
          </dl>
          <div className="mt-4">
            <AvailabilityStrip days={space.occupancy} capacity={space.capacity} />
            <p className="mt-1 text-[13px] text-muted">
              {space.nextFreeStart ? `Próxima data livre: ${formatDateBR(space.nextFreeStart)}` : "Sem datas livres nos próximos meses."}
            </p>
          </div>
          {!open && space.nextFreeStart && (
            <button type="button" onClick={() => setOpen(true)} className="neu-primary mt-4 rounded-full px-6 py-2.5 text-[15px] font-medium text-white">
              Reservar espaço
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <label className="text-[14px]">Início
            <input type="date" min={addDays(today, space.leadDays)} value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </label>
          <label className="text-[14px]">Término
            <input type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </label>
          {periodError && <p className="text-[14px] text-red-700 sm:col-span-2">{periodError}</p>}
          {!periodError && start && end && !available && (
            <p className="text-[14px] text-red-700 sm:col-span-2">Há dias ocupados neste período. Veja as faixas cinza acima e escolha outras datas.</p>
          )}
          <label className="text-[14px] sm:col-span-2">Título do anúncio
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputClass} />
          </label>
          <label className="text-[14px] sm:col-span-2">Para onde o anúncio leva
            <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://… ou /empresa/seu-nome" className={inputClass} />
          </label>
          {([["desktop", "Arte para computador", `${space.width}×${space.height}px`, desktop], ["mobile", "Arte para celular", `${mobileSize.width}×${mobileSize.height}px`, mobile]] as const).map(
            ([device, label, size, state]) => (
              <label key={device} className="text-[14px]">{label} <span className="text-muted">({size})</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={inputClass}
                  onChange={(e) => void pickFile(device, e.target.files?.[0])}
                />
                {state.busy && <span className="text-[13px] text-muted">Conferindo a arte…</span>}
                {state.url && <span className="text-[13px] text-emerald-700">Arte aprovada no formato.</span>}
                {state.error && <span className="block text-[13px] text-red-700">{state.error}</span>}
              </label>
            ),
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
            <p className="text-[15px]">
              {days > 0 ? <><strong>{days} dia(s)</strong> · total <strong className="text-primary">{formatCents(price)}</strong></> : "Escolha as datas"}
            </p>
            <button
              type="button"
              disabled={!ready || isPending}
              onClick={submit}
              className="neu-primary rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Enviando…" : "Confirmar reserva"}
            </button>
          </div>
          {message && <p className={`text-[14px] sm:col-span-2 ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
        </div>
      )}
    </article>
  );
}
