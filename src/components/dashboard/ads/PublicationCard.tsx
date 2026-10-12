"use client";

import { useMemo, useState, useTransition } from "react";
import { bookPublication, uploadPublicationImage } from "@/lib/actions/publications";
import { applyDiscount } from "@/lib/ad-plan-benefits";
import { formatCents, formatDateBR } from "@/lib/utils";
import type { PublicationOffer } from "@/lib/services/publication-store";

const inputClass = "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[15px] text-foreground";

/** Produto de publicação (Story, newsletter, matéria): escolhe data e horário livres, envia a arte e reserva. */
export function PublicationCard({ offer, discountPercent }: { offer: PublicationOffer; discountPercent: number }) {
  const { product, slots, includedLeft } = offer;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dates = useMemo(() => [...new Set(slots.map((slot) => slot.date))], [slots]);
  const [date, setDate] = useState(dates[0] ?? "");
  const times = slots.filter((slot) => slot.date === date).map((slot) => slot.time);
  const [time, setTime] = useState(times[0] ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [image, setImage] = useState({ url: "", error: null as string | null, busy: false });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const needsImage = Boolean(product.imageWidth);
  const price = includedLeft > 0 ? 0 : applyDiscount(product.priceCents, discountPercent);
  const ready = date && (times.length === 0 || times.includes(time) || product.rules.timeSlots.length === 0) && title.trim().length >= 3 && (!needsImage || image.url);

  async function pickImage(file: File | undefined) {
    if (!file) return;
    setImage({ url: "", error: null, busy: true });
    const body = new FormData();
    body.set("file", file);
    body.set("productId", product.id);
    const result = await uploadPublicationImage(body).catch(() => ({ success: false as const, error: "Falha no envio." }));
    setImage(result.success ? { url: result.url, error: null, busy: false } : { url: "", error: result.error, busy: false });
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await bookPublication({ productId: product.id, date, time, title, body, linkUrl, imageUrl: image.url || undefined }).catch(
        () => ({ success: false as const, error: "Não foi possível reservar agora." }),
      );
      setMessage(
        result.success
          ? { ok: true, text: result.included ? "Reservado com o benefício do seu plano! Nossa equipe revisa o conteúdo e, depois de aprovado, publicamos sozinhos na data marcada." : "Reserva enviada! Siga com o pagamento pelo Suporte; depois de aprovado, publicamos na data marcada." }
          : { ok: false, text: result.error },
      );
    });
  }

  return (
    <article className="glass-card-light rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold text-foreground">{product.name}</h3>
          {product.description && <p className="mt-1 text-[14px] text-muted">{product.description}</p>}
          {product.creativeSpecs && <p className="mt-1 text-[13px] text-muted">Formato: {product.creativeSpecs}</p>}
          <p className="mt-2 text-[13px] text-muted">
            {slots.length > 0 ? `${slots.length} horário(s) livre(s) nos próximos 60 dias.` : "Sem horários livres no momento."}
            {includedLeft > 0 && <span className="ml-1 font-medium text-emerald-700">Seu plano inclui {includedLeft} neste mês.</span>}
          </p>
        </div>
        <p className="text-[15px] font-semibold text-primary">
          {includedLeft > 0 ? "Incluído no plano" : formatCents(applyDiscount(product.priceCents, discountPercent))}
        </p>
      </div>
      {!open && slots.length > 0 && (
        <button type="button" onClick={() => setOpen(true)} className="neu-primary mt-4 rounded-full px-6 py-2.5 text-[15px] font-medium text-white">
          Reservar data
        </button>
      )}
      {open && (
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <label className="text-[14px]">Data
            <select value={date} onChange={(e) => { setDate(e.target.value); setTime(slots.find((s) => s.date === e.target.value)?.time ?? ""); }} className={inputClass}>
              {dates.map((value) => <option key={value} value={value}>{formatDateBR(value)}</option>)}
            </select>
          </label>
          {product.rules.timeSlots.length > 0 && (
            <label className="text-[14px]">Horário
              <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass}>
                {times.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          )}
          <label className="text-[14px] sm:col-span-2">Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className={inputClass} />
          </label>
          <label className="text-[14px] sm:col-span-2">Texto (opcional)
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} className={inputClass} />
          </label>
          <label className="text-[14px] sm:col-span-2">Link (opcional)
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… ou /empresa/seu-nome" className={inputClass} />
          </label>
          {needsImage && (
            <label className="text-[14px] sm:col-span-2">Arte ({product.imageWidth}×{product.imageHeight}px)
              <input type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} onChange={(e) => void pickImage(e.target.files?.[0])} />
              {image.busy && <span className="text-[13px] text-muted">Conferindo a arte…</span>}
              {image.url && <span className="text-[13px] text-emerald-700">Arte aprovada no formato.</span>}
              {image.error && <span className="block text-[13px] text-red-700">{image.error}</span>}
            </label>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
            <p className="text-[15px]">Total: <strong className="text-primary">{price === 0 ? "Incluído no plano" : formatCents(price)}</strong></p>
            <button type="button" disabled={!ready || isPending} onClick={submit} className="neu-primary rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-50">
              {isPending ? "Enviando…" : "Confirmar reserva"}
            </button>
          </div>
          {message && <p className={`text-[14px] sm:col-span-2 ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
        </div>
      )}
    </article>
  );
}
