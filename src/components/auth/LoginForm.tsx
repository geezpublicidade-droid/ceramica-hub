import Link from "next/link";
import { authenticateAction } from "@/lib/auth-actions";
import { BackLink } from "@/components/nav/BackLink";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type LoginFormProps = {
  role: "business" | "member" | "admin";
  loginPath: string;
  defaultRedirect: string;
  callbackUrl?: string;
  error?: string;
  title: string;
  subtitle: string;
  /** Área sem login por senha (hoje só membro) — mostra só o botão do Google. */
  googleOnly?: boolean;
};

function errorMessage(error: string, role: LoginFormProps["role"]): string {
  if (error !== "google_not_found") return "E-mail ou senha incorretos.";
  if (role === "business") return "Não encontramos empresa cadastrada com esse e-mail do Google. Cadastre sua empresa em /cadastro.";
  return "Esse e-mail do Google não tem acesso a esta área.";
}

export function LoginForm({
  role,
  loginPath,
  defaultRedirect,
  callbackUrl,
  error,
  title,
  subtitle,
  googleOnly,
}: LoginFormProps) {
  const redirectTarget = callbackUrl ?? defaultRedirect;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-graphite px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), var(--primary) 60%, transparent 75%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-4">
          <BackLink href="/preview" label="Voltar ao site" />
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white p-8 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-foreground">
          <img src="/images/logo-ceramica-hub.png" alt="" className="h-7 w-7" />
          Cerâmica <span className="text-primary">Hub</span>
        </Link>
        <h1 className="mt-6 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-[15px] text-muted">{subtitle}</p>

        {error ? (
          <p className="mt-6 rounded-xl bg-red-500/10 px-3 py-2 text-[15px] text-red-600">
            {errorMessage(error, role)}
          </p>
        ) : null}

        {!googleOnly && (
          <>
            <form action={authenticateAction} className="mt-6 flex flex-col gap-4">
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="loginPath" value={loginPath} />
              <input type="hidden" name="callbackUrl" value={redirectTarget} />

              <label className="flex flex-col gap-1.5 text-[15px] text-muted">
                E-mail
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[16px] text-foreground outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[15px] text-muted">
                Senha
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[16px] text-foreground outline-none"
                />
              </label>

              <button
                type="submit"
                className="neu-primary mt-2 rounded-full px-4 py-2.5 text-[15px] font-medium text-white"
              >
                Entrar
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
              <span className="h-px flex-1 bg-foreground/10" />
              ou
              <span className="h-px flex-1 bg-foreground/10" />
            </div>
          </>
        )}

        <div className={googleOnly ? "mt-6" : undefined}>
          <GoogleSignInButton area={role} callbackUrl={redirectTarget} />
        </div>

        {!googleOnly && role === "business" && (
          <Link href="/esqueci-senha" className="mt-4 block text-center text-[14px] text-primary underline">
            Esqueci minha senha
          </Link>
        )}
        </div>
      </div>
    </main>
  );
}
