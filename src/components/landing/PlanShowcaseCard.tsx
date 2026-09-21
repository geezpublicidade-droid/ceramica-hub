import { BusinessAvatar } from "@/components/BusinessAvatar";
import { limitsFor } from "@/lib/plan-limits";
import type { Business } from "@/data/businesses";

const SAMPLE = {
  name: "Studio Exemplo",
  initials: "SE",
  category: "Moda & Beleza",
  floor: "Torre Park · 5º andar · sala 102",
  description: "Atendimento personalizado, feito sob medida pra cada cliente que passa pela nossa sala.",
};

const SAMPLE_SERVICES = [
  "Consultoria inicial",
  "Acompanhamento mensal",
  "Projeto sob medida",
  "Manutenção preventiva",
  "Suporte prioritário",
  "Visita técnica",
];

function FeaturePill({ label, locked }: { label: string; locked?: boolean }) {
  return (
    <span
      className={
        locked
          ? "rounded-full border border-dashed border-border px-3 py-1 text-[12px] text-muted"
          : "rounded-full bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary"
      }
    >
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

/** Mockup fictício da página pública da empresa nesse plano -- não usa dados
 * reais, é só pra ilustrar visualmente o que cada tier libera/trava. Vive nas
 * páginas de detalhe em /planos/[plano]. */
export function PlanShowcaseCard({ plan }: { plan: Business["plan"] }) {
  const limits = limitsFor(plan);
  const hasGallery = limits.maxPhotos > 0;
  const hasServices = limits.maxServices > 0;
  const hasDescription = plan !== "presenca";
  const galleryCount = Math.min(Number.isFinite(limits.maxPhotos) ? limits.maxPhotos : 8, 6);
  const serviceCount = Math.min(Number.isFinite(limits.maxServices) ? limits.maxServices : SAMPLE_SERVICES.length, 4);

  return (
    <div className="glass-light rounded-3xl p-6 sm:p-7">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">
        Como a página aparece nesse plano
      </p>

      <div className="mt-4 rounded-2xl border border-border bg-white/70 p-5">
        <div className="flex gap-4">
          <BusinessAvatar
            business={{ name: SAMPLE.name, initials: SAMPLE.initials }}
            className="h-16 w-16 shrink-0 rounded-full bg-primary/10"
            textClassName="text-[18px] font-semibold text-primary"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[18px] font-semibold text-foreground">{SAMPLE.name}</h3>
              {plan !== "presenca" && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">
                  Patrocinada
                </span>
              )}
              {limits.featuredAllowed && (
                <span className="rounded-full bg-graphite/10 px-2.5 py-0.5 text-[12px] font-medium text-graphite">
                  Destaque rotativo
                </span>
              )}
            </div>
            <p className="mt-1 text-[14px] text-muted">
              {SAMPLE.category} · {SAMPLE.floor}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {hasDescription ? (
            <p className="text-[15px] leading-relaxed text-muted">{SAMPLE.description}</p>
          ) : (
            <LockedBlock label="Descrição completa da empresa" />
          )}
        </div>

        <div className="mt-4">
          <p className="text-[13px] font-medium text-foreground">
            Galeria{hasGallery ? ` (até ${Number.isFinite(limits.maxPhotos) ? limits.maxPhotos : "muitas"} fotos)` : ""}
          </p>
          {hasGallery ? (
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
          <p className="text-[13px] font-medium text-foreground">
            Serviços{hasServices ? ` (até ${Number.isFinite(limits.maxServices) ? limits.maxServices : "ilimitados"})` : ""}
          </p>
          {hasServices ? (
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
          <FeaturePill label="Promoção ativa" locked={limits.maxPromotions === 0} />
          <FeaturePill label="Cupom rastreável" locked={!limits.couponsAllowed} />
          <FeaturePill label="Vídeo em destaque" locked={!limits.videoAllowed} />
          <FeaturePill label="Sala 3D" locked={!limits.virtualTourAllowed} />
        </div>
      </div>
    </div>
  );
}
