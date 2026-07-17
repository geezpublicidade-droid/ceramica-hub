const ADMIN_WHATSAPP = "5511999999999";

const linkGroups: { label: string; href: string }[] = [
  { label: "Empresas", href: "#empresas" },
  { label: "Categorias", href: "#empresas" },
  { label: "Oportunidades", href: "#oportunidades" },
  { label: "Ofertas", href: "#beneficios" },
  { label: "Cadastrar empresa", href: "#cadastro" },
  { label: "WhatsApp", href: `https://wa.me/${ADMIN_WHATSAPP}` },
];

export function CinematicFooter() {
  return (
    <footer className="border-t border-border bg-surface px-6 py-16 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[17px] font-semibold tracking-tight">
              Cerâmica <span className="text-primary">Hub</span>
            </p>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              Empresas próximas. Conexões reais. Novas oportunidades.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-muted">
            {linkGroups.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Um projeto Geez Publicidade.</p>
          <p>© {new Date().getFullYear()} Cerâmica Hub.</p>
        </div>
      </div>
    </footer>
  );
}
