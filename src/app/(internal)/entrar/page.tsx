import Link from "next/link";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Entrar — Cerâmica Hub" };

const OPTIONS = [
  {
    href: "/login",
    title: "Sou uma empresa",
    subtitle: "Acesse o painel da sua empresa no Cerâmica Hub.",
    cta: "Entrar como empresa",
    dark: true,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
      </svg>
    ),
  },
  {
    href: "/membro/login",
    title: "Sou visitante",
    subtitle: "Favorite empresas e acompanhe oportunidades com sua conta do Google.",
    cta: "Entrar como visitante",
    dark: false,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
];

export default function EntrarPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-graphite px-6 py-16">
      {/* Blob gradiente terracota -- mesma linguagem visual do componente de
          referência, sem o mecanismo de toggle (aqui são 2 destinos reais
          mostrados ao mesmo tempo, não 2 formulários pra alternar). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), var(--primary) 60%, transparent 75%)" }}
      />

      <div className="relative w-full max-w-3xl">
        <div className="mb-6">
          <BackLink href="/preview" label="Voltar ao site" />
        </div>

        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-[19px] font-semibold tracking-tight text-white">
            <img src="/images/logo-ceramica-hub.png" alt="" className="h-8 w-8" />
            Cerâmica <span className="text-primary-light">Hub</span>
          </Link>
          <h1 className="mt-5 text-[clamp(1.6rem,3.5vw,2.25rem)] font-semibold tracking-tight text-white">
            Como você quer entrar?
          </h1>
          <p className="mt-2 text-[15px] text-white/70">Escolha o acesso certo pra sua conta.</p>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] sm:grid-cols-2">
          {OPTIONS.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className={`group flex flex-col justify-between gap-8 p-8 transition-colors sm:p-10 ${
                option.dark ? "bg-graphite text-white hover:bg-[#22261f]" : "bg-white text-foreground hover:bg-surface"
              }`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  option.dark ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {option.icon}
              </span>
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight">{option.title}</h2>
                <p className={`mt-2 text-[15px] leading-relaxed ${option.dark ? "text-white/70" : "text-muted"}`}>
                  {option.subtitle}
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center gap-1.5 text-[14px] font-medium transition-transform group-hover:translate-x-1 ${
                  option.dark ? "text-white" : "text-primary"
                }`}
              >
                {option.cta}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>

        <Link href="/admin/login" className="mt-6 block text-center text-[13px] text-white/50 underline hover:text-white/80">
          Sou administrador do Cerâmica Hub
        </Link>
      </div>
    </main>
  );
}
