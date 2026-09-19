import Link from "next/link";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Entrar — Cerâmica Hub" };

const OPTIONS = [
  {
    href: "/login",
    title: "Sou uma empresa",
    subtitle: "Acesse o painel da sua empresa no Cerâmica Hub.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
      </svg>
    ),
  },
  {
    href: "/membro/login",
    title: "Sou visitante",
    subtitle: "Favorite empresas e acompanhe oportunidades com sua conta do Google.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
];

export default function EntrarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-4">
          <BackLink href="/preview" label="Voltar ao site" />
        </div>
        <div className="glass-light rounded-3xl p-8">
          <Link href="/" className="text-[17px] font-semibold tracking-tight text-foreground">
            Cerâmica <span className="text-primary">Hub</span>
          </Link>
          <h1 className="mt-6 text-xl font-semibold text-foreground">Entrar</h1>
          <p className="mt-1 text-[15px] text-muted">Escolha como você quer acessar o Cerâmica Hub.</p>

          <div className="mt-6 flex flex-col gap-3">
            {OPTIONS.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="neu flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition hover:bg-black/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {option.icon}
                </span>
                <span>
                  <span className="block text-[16px] font-medium text-foreground">{option.title}</span>
                  <span className="block text-[14px] text-muted">{option.subtitle}</span>
                </span>
              </Link>
            ))}
          </div>

          <Link href="/admin/login" className="mt-6 block text-center text-[13px] text-muted underline">
            Sou administrador do Cerâmica Hub
          </Link>
        </div>
      </div>
    </main>
  );
}
