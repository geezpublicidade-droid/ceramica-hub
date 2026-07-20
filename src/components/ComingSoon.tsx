import Image from "next/image";

const heroImages = [
  "/images/ceramica-hero-1.jpg",
  "/images/ceramica-hero-2.jpg",
  "/images/ceramica-hero-3.jpg",
  "/images/ceramica-hero-4.jpg",
];

const CYCLE_SECONDS = 24;

export function ComingSoon() {
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-foreground">
      <div className="absolute inset-0">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className="hero-slide absolute inset-0"
            style={{ animationDelay: `${i * -(CYCLE_SECONDS / heroImages.length)}s` }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        {/* esfumaçado branco — vela as fotos gradualmente pra baixo, garantindo
            leitura do texto independente de qual das 4 imagens está no topo */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/55 to-white/92" />
        <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_50%_38%,rgba(255,255,255,0.6),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_-10%,rgba(41,151,255,0.18),transparent_60%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </span>
        <a
          href="/cadastro"
          className="glass-light rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/80"
        >
          Cadastre sua empresa
        </a>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="glass-light mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted sm:text-[12px]">
          Espaço Cerâmica · São Caetano do Sul
        </span>
        <h1 className="max-w-3xl text-[16vw] font-semibold leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl">
          Em breve.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-[17px]">
          Estamos preparando o ponto de encontro das empresas, profissionais e oportunidades das
          torres Park, Union, Way e Gate. Tudo em um só lugar.
        </p>
      </main>

      <footer className="relative z-10 flex items-center justify-center px-6 py-8 text-[12px] text-muted">
        © {year} Cerâmica Hub — todos os direitos reservados
      </footer>
    </div>
  );
}
