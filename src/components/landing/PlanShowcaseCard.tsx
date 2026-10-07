import { MessageCircle } from "lucide-react";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { landingCapabilitiesFromFeatures } from "@/lib/landing/sections";
import { listingBadge } from "@/lib/plans/ranking";
import type { FeatureMap } from "@/lib/plans/features";

const SAMPLE = {
  name: "Studio Exemplo",
  initials: "SE",
  category: "Moda & Beleza",
  floor: "Torre Park · 5º andar · sala 102",
  description: "Atendimento personalizado, feito sob medida pra cada cliente que passa pela nossa sala.",
};

const SAMPLE_SERVICES = ["Consultoria inicial", "Acompanhamento mensal", "Projeto sob medida", "Manutenção preventiva", "Suporte prioritário", "Visita técnica"];

const BADGE_LABEL = { premium: "Premium", featured: "Em destaque", sponsored: "Patrocinada" } as const;
const LAYOUT_LABEL = { basic: "Página básica", standard: "Perfil comercial padronizado", landing: "Landing page personalizada" } as const;

function FeaturePill({ label, locked }: { label: string; locked?: boolean }) {
  return (
    <span className={locked ? "rounded-full border border-dashed border-border px-3 py-1 text-[12px] text-muted" : "rounded-full bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary"}>
      {locked ? "🔒 " : ""}
      {label}
    </span>
  );
}

function LockedBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-black/[0.02] px-3 py-2.5 text-[13px] text-muted">
      <span aria-hidden="true">🔒</span> {label}
    </div>
  );
}

const countLabel = (n: number, unit: string) => (Number.isFinite(n) ? `${n} ${unit}` : `${unit} ilimitados`);

/**
 * Mockup fictício da página pública nesse plano. É montado direto da MATRIZ de recursos (mesma fonte do site e do painel),
 * então o que aparece liberado ou bloqueado aqui nunca diverge do que o plano realmente entrega.
 */
export function PlanShowcaseCard({ features }: { features: FeatureMap }) {
  const caps = landingCapabilitiesFromFeatures(features);
  const badge = listingBadge(features);
  const galleryCount = Math.min(Number.isFinite(caps.maxGalleryItems) ? caps.maxGalleryItems : 8, 6);
  const serviceCount = Math.min(Number.isFinite(caps.maxServices) ? caps.maxServices : SAMPLE_SERVICES.length, 4);

  return (
    <div className="glass-light rounded-3xl p-6 sm:p-7">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Como a página aparece nesse plano</p>
      <p className="mt-1 text-[13.5px] font-medium text-primary">{LAYOUT_LABEL[caps.layout]}</p>

      <div className="mt-4 rounded-2xl border border-border bg-white/70 p-5">
        <div className="flex gap-4">
          <BusinessAvatar business={{ name: SAMPLE.name, initials: SAMPLE.initials }} className="h-16 w-16 shrink-0 rounded-full bg-primary/10" textClassName="text-[18px] font-semibold text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[18px] font-semibold text-foreground">{SAMPLE.name}</h3>
              {badge && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">{BADGE_LABEL[badge]}</span>}
            </div>
            <p className="mt-1 text-[14px] text-muted">
              {SAMPLE.category} · {SAMPLE.floor}
            </p>
          </div>
        </div>

        <div className="mt-4">{caps.fullDescription ? <p className="text-[15px] leading-relaxed text-muted">{SAMPLE.description}</p> : <LockedBlock label="Descrição completa da empresa" />}</div>

        <div className="mt-3">
          {caps.whatsapp ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-whatsapp px-4 py-2 text-[13px] font-semibold text-white">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Falar pelo WhatsApp
            </span>
          ) : (
            <LockedBlock label="WhatsApp e redes sociais" />
          )}
        </div>

        <div className="mt-4">
          <p className="text-[13px] font-medium text-foreground">Galeria{caps.gallery ? ` (${Number.isFinite(caps.maxGalleryItems) ? `até ${caps.maxGalleryItems} fotos` : "muitas fotos"})` : ""}</p>
          {caps.gallery ? (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Array.from({ length: galleryCount }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-primary/15 to-graphite/10" />
              ))}
            </div>
          ) : (
            <div className="mt-2">
              <LockedBlock label="Galeria de fotos" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[13px] font-medium text-foreground">Serviços{caps.maxServices > 0 ? ` (${Number.isFinite(caps.maxServices) ? `até ${caps.maxServices}` : "ilimitados"})` : ""}</p>
          {caps.maxServices > 0 ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {SAMPLE_SERVICES.slice(0, serviceCount).map((service) => (
                <div key={service} className="rounded-lg border border-border px-3 py-1.5 text-[13px] text-foreground">
                  {service}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2">
              <LockedBlock label="Lista de serviços" />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FeaturePill label={caps.maxPromotions > 0 ? `Promoção ativa (${countLabel(caps.maxPromotions, caps.maxPromotions === 1 ? "promoção" : "promoções").replace("promoções ilimitados", "ilimitadas")})` : "Promoção ativa"} locked={caps.maxPromotions === 0} />
          <FeaturePill label="Cupom rastreável" locked={!caps.trackableCoupons} />
          <FeaturePill label="Vídeo em destaque" locked={!caps.video} />
          <FeaturePill label="FAQ" locked={!caps.faq} />
          <FeaturePill label="Formulário próprio" locked={!caps.leadForm} />
          <FeaturePill label="Hero personalizado" locked={!caps.customCover} />
          <FeaturePill label="Sala 3D" locked={!caps.virtualTour} />
        </div>
      </div>
    </div>
  );
}
