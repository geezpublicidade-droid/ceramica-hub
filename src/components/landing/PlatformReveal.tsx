import { FadeUp } from "@/components/motion/FadeUp";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import type { Business } from "@/data/businesses";

type PlatformRevealProps = {
  businesses: Business[];
  categories: string[];
};

export function PlatformReveal({ businesses, categories }: PlatformRevealProps) {
  const preview = businesses.slice(0, 3);

  return (
    <section className="bg-surface px-6 py-28 text-foreground">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
            A plataforma
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            Toda a rede em um só lugar.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Pesquise empresas, conheça serviços, descubra benefícios e inicie novas
            conexões sem sair do Cerâmica.
          </p>
        </FadeUp>

        <FadeUp
          delay={0.1}
          className="glass-light relative mt-14 overflow-hidden rounded-3xl p-3 shadow-[0_40px_100px_-30px_rgba(0,113,227,0.18)] sm:p-4"
        >
          <div className="flex items-center gap-1.5 px-2 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            <span className="ml-3 text-[12px] text-muted">ceramicahub.com.br</span>
          </div>

          <div className="rounded-2xl border border-border bg-white/60 p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-full border border-border bg-white px-5 py-3 text-[14px] text-muted">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-muted">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Busque por empresa, serviço, categoria ou especialidade
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.slice(0, 5).map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[12px] text-muted"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {preview.map((business) => (
                <div
                  key={business.id}
                  className="glass-card-light rounded-xl p-4 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <BusinessAvatar
                      business={business}
                      className="h-9 w-9 rounded-full bg-surface"
                      textClassName="text-[12px] font-semibold"
                    />
                    {business.featured && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[14px] font-semibold tracking-tight">{business.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{business.category}</p>
                  <a
                    href={buildWhatsAppLink(business.phone, business.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary"
                  >
                    Falar no WhatsApp
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
