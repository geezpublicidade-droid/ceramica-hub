import { getActivePartners } from "@/lib/services/institutional-partners";

/**
 * Faixa de apoio institucional -- só mostra parceiro com status "ativo"
 * (autorização confirmada pelo admin). Sem estilo final ainda (ver
 * DIAGRAMA SITE.pdf: "logos monocromáticos e baixo contraste") -- essa
 * versão é só funcional, o visual fica pra depois.
 */
export async function InstitutionalPartners() {
  const partners = await getActivePartners();
  if (partners.length === 0) return null;

  return (
    <div className="border-y border-border bg-surface px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {partners.map((partner) =>
          partner.link ? (
            <a
              key={partner.id}
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[14px] text-muted transition-colors hover:text-foreground"
            >
              {partner.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.logoUrl} alt={partner.name} className="h-8 w-auto grayscale opacity-70" />
              )}
              {!partner.logoUrl && partner.name}
            </a>
          ) : (
            <span key={partner.id} className="flex items-center gap-2 text-[14px] text-muted">
              {partner.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.logoUrl} alt={partner.name} className="h-8 w-auto grayscale opacity-70" />
              )}
              {!partner.logoUrl && partner.name}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
