"use client";

import { useState } from "react";
import Link from "next/link";
import { saveOfferDetails } from "@/lib/actions/landing-editor";
import type { EditorOffer } from "@/lib/services/landing-editor-data";
import { UploadButton } from "../UploadButton";
import { Field, TabIntro, UpgradeNote, buttonClass, ghostButtonClass, inputClass, useSaver } from "../ui";
import type { TabProps } from "../types";

function OfferRow({ offer, target }: { offer: EditorOffer; target?: string }) {
  const [imageUrl, setImageUrl] = useState(offer.imageUrl ?? "");
  const [ctaLabel, setCtaLabel] = useState(offer.ctaLabel ?? "");
  const { pending, message, run } = useSaver();
  const expired = offer.validUntil !== null && offer.validUntil < new Date().toISOString().slice(0, 10);

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <p className="text-[15px] font-semibold">{offer.title}</p>
      <p className="mt-0.5 text-[13.5px] text-muted">
        {[offer.couponCode ? `Cupom ${offer.couponCode}` : null, offer.validUntil ? `válida até ${offer.validUntil.split("-").reverse().join("/")}` : "sem validade", !offer.active ? "desativada" : expired ? "vencida" : "no ar"]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <Field label="Texto do botão" hint='Padrão: "Quero aproveitar"'>
          <input maxLength={30} value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex items-center gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-14 w-20 rounded-md object-cover" />
          )}
          <UploadButton target={target} label={imageUrl ? "Trocar imagem" : "Enviar imagem"} onUploaded={setImageUrl} />
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl("")} className={ghostButtonClass}>
              Sem imagem
            </button>
          )}
        </div>
        <button type="button" disabled={pending} onClick={() => run(() => saveOfferDetails(target, { id: offer.id, imageUrl: imageUrl || null, ctaLabel: ctaLabel || null }))} className={buttonClass}>
          Salvar
        </button>
        {message && <span className={`text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </li>
  );
}

/** Oferta exclusiva: a promoção ativa mais recente vira o banner terracota. Criar/encerrar promoções fica em "Editar página". */
export function OffersTab({ data, target }: TabProps) {
  if (!data.capabilities.offer) return <UpgradeNote>A oferta exclusiva em destaque faz parte do plano Destaque ou superior.</UpgradeNote>;

  return (
    <div className="space-y-5">
      <TabIntro>
        A promoção ativa e dentro da validade mais recente aparece como banner. Registramos cliques e o uso do cupom. Sem promoção ativa, a seção some.{" "}
        <Link href="/dashboard/editar" className="font-medium text-primary hover:underline">
          Criar ou encerrar promoções
        </Link>
      </TabIntro>
      {data.offers.length === 0 ? (
        <p className="text-[14.5px] text-muted">Nenhuma promoção cadastrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {data.offers.map((offer) => (
            <OfferRow key={`${offer.id}-${offer.imageUrl}-${offer.ctaLabel}`} offer={offer} target={target} />
          ))}
        </ul>
      )}
    </div>
  );
}
