"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { TrackedInterestLink } from "./TrackedInterestLink";

export type ServiceCard = {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
  /** "A partir de R$ 120" já formatado, ou null */
  priceLabel: string | null;
  duration: string | null;
  ctaLabel: string | null;
  href: string;
};

const INITIAL_VISIBLE = 4;

/** Grade de serviços/produtos: mostra os primeiros e libera o resto em "Ver todos". Cada clique abre o WhatsApp com a mensagem do serviço. */
export function ServicesGrid({ businessId, items }: { businessId: string; items: ServiceCard[] }) {
  const t = useTranslations("LandingEmpresa");
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((item) => (
          <li key={item.id} className="flex flex-col overflow-hidden rounded-md border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {item.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photo} alt={item.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{item.name}</h3>
              {item.description && <p className="mt-1.5 text-[14.5px] leading-relaxed text-foreground/70">{item.description}</p>}
              {(item.priceLabel || item.duration) && (
                <p className="mt-2.5 text-[13px] font-medium text-foreground/80">
                  {[item.priceLabel, item.duration ? t("duration", { value: item.duration }) : null].filter(Boolean).join(" · ")}
                </p>
              )}
              <TrackedInterestLink
                href={item.href}
                businessId={businessId}
                itemId={item.id}
                event="service_clicked"
                className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-primary hover:underline"
              >
                {item.ctaLabel ?? t("learnMore")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedInterestLink>
            </div>
          </li>
        ))}
      </ul>
      {items.length > INITIAL_VISIBLE && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-6 text-[14px] font-semibold text-primary hover:underline">
          {expanded ? t("servicesLess") : t("servicesAll")}
        </button>
      )}
    </>
  );
}
