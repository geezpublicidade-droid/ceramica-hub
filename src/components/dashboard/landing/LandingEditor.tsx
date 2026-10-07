"use client";

import { useState, type ComponentType } from "react";
import type { LandingEditorData } from "@/lib/services/landing-editor-data";
import { setLandingStatus } from "@/lib/actions/landing-editor";
import { ConversionTab } from "./tabs/ConversionTab";
import { FaqTab } from "./tabs/FaqTab";
import { GalleryTab } from "./tabs/GalleryTab";
import { HeroTab } from "./tabs/HeroTab";
import { LocationTab } from "./tabs/LocationTab";
import { MainTab } from "./tabs/MainTab";
import { MetricsTab } from "./tabs/MetricsTab";
import { OffersTab } from "./tabs/OffersTab";
import { ReviewsTab } from "./tabs/ReviewsTab";
import { SeoTab } from "./tabs/SeoTab";
import { ServicesTab } from "./tabs/ServicesTab";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { usePlanFeatures } from "@/components/plans/PlanProvider";
import { PlanMatrix } from "./PlanMatrix";
import type { TabProps } from "./types";
import { buttonClass, ghostButtonClass, useSaver } from "./ui";

/** Recurso que libera cada aba (a matriz central decide; sem ele a aba mostra o convite ao upgrade). */
const TABS: { key: string; label: string; Component: ComponentType<TabProps>; feature?: string; lockedText?: string }[] = [
  { key: "main", label: "Informações principais", Component: MainTab, feature: "custom_sections", lockedText: "Apresentação, diferenciais e barra de confiança fazem parte da landing page personalizada." },
  { key: "hero", label: "Hero e identidade visual", Component: HeroTab },
  { key: "services", label: "Serviços", Component: ServicesTab, feature: "services", lockedText: "Cadastre serviços com foto e descrição." },
  { key: "offers", label: "Ofertas", Component: OffersTab, feature: "active_promotions", lockedText: "Publique promoções em destaque." },
  { key: "gallery", label: "Galeria e vídeos", Component: GalleryTab, feature: "gallery_images", lockedText: "Mostre fotos reais da sua empresa." },
  { key: "reviews", label: "Depoimentos", Component: ReviewsTab },
  { key: "location", label: "Localização e horários", Component: LocationTab, feature: "business_hours", lockedText: "Horários, estacionamento, acessibilidade e redes sociais." },
  { key: "faq", label: "FAQ", Component: FaqTab, feature: "faq", lockedText: "Responda as dúvidas que mais travam um contato." },
  { key: "conversion", label: "Botões e conversão", Component: ConversionTab, feature: "whatsapp", lockedText: "Botão de WhatsApp, formulário e chamadas finais." },
  { key: "seo", label: "SEO", Component: SeoTab, feature: "custom_sections", lockedText: "Título e descrição próprios para o Google." },
  { key: "metrics", label: "Métricas", Component: MetricsTab, feature: "metrics_summary", lockedText: "Acompanhe visualizações e contatos." },
];

type LandingEditorProps = {
  data: LandingEditorData;
  /** id da empresa quando um admin edita; ausente = a própria empresa */
  target?: string;
  /** rota do preview (rascunho incluso) */
  previewHref: string;
  /** rota pública da página */
  publicHref: string;
};

/** Editor da landing: 11 abas, publicar/despublicar e prévia. Cada aba salva só o seu pedaço. */
export function LandingEditor({ data, target, previewHref, publicHref }: LandingEditorProps) {
  const [active, setActive] = useState(TABS[0].key);
  const { pending, message, run } = useSaver();
  const published = data.config.status === "published";
  const { canAccess } = usePlanFeatures();
  const current = TABS.find((tab) => tab.key === active)!;
  const Current = current.Component;
  const locked = current.feature !== undefined && !canAccess(current.feature);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-4">
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${published ? "bg-whatsapp/10 text-whatsapp" : "bg-amber-100 text-amber-800"}`}>
          {published ? "Publicada" : "Rascunho"}
        </span>
        <p className="flex-1 text-[13.5px] text-muted">
          {published ? "O público vê a página completa." : "O público vê só o conteúdo básico da empresa até você publicar."}
        </p>
        <a href={previewHref} target="_blank" rel="noopener noreferrer" className={ghostButtonClass}>
          Pré-visualizar
        </a>
        {published && (
          <a href={publicHref} target="_blank" rel="noopener noreferrer" className={ghostButtonClass}>
            Ver página
          </a>
        )}
        <button type="button" disabled={pending} onClick={() => run(() => setLandingStatus(target, published ? "draft" : "published"), published ? "Página despublicada." : "Página publicada.")} className={published ? ghostButtonClass : buttonClass}>
          {published ? "Despublicar" : "Publicar"}
        </button>
        {message && <span className={`w-full text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
      </div>

      <PlanMatrix currentPlan={data.business.effectivePlan} previewHref={previewHref} />

      <div role="tablist" aria-label="Seções da landing page" className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={`tap shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition ${active === tab.key ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-black/5"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-5">
        {locked && current.feature ? <UpgradePrompt feature={current.feature} label={current.label} description={current.lockedText} /> : <Current data={data} target={target} />}
      </div>
    </div>
  );
}
