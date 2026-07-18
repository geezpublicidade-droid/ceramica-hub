import { authenticateAction } from "@/lib/auth-actions";

type LoginFormProps = {
  role: "business" | "member" | "admin";
  loginPath: string;
  defaultRedirect: string;
  callbackUrl?: string;
  error?: string;
  title: string;
  subtitle: string;
};

export function LoginForm({
  role,
  loginPath,
  defaultRedirect,
  callbackUrl,
  error,
  title,
  subtitle,
}: LoginFormProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="glass-light w-full max-w-sm rounded-3xl p-8">
        <a href="/" className="text-[15px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </a>
        <h1 className="mt-6 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-[13px] text-muted">{subtitle}</p>

        <form action={authenticateAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="loginPath" value={loginPath} />
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? defaultRedirect} />

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-600">
              E-mail ou senha incorretos.
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            E-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[14px] text-foreground outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] text-muted">
            Senha
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[14px] text-foreground outline-none"
            />
          </label>

          <button
            type="submit"
            className="neu-primary mt-2 rounded-full px-4 py-2.5 text-[13px] font-medium text-white"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
