import { authenticateAction } from "@/lib/auth-actions";

type LoginFormProps = {
  role: "business" | "member" | "admin";
  loginPath: string;
  defaultRedirect: string;
  callbackUrl?: string;
  error?: string;
  title: string;
  subtitle: string;
  totpRequired?: boolean;
};

export function LoginForm({
  role,
  loginPath,
  defaultRedirect,
  callbackUrl,
  error,
  title,
  subtitle,
  totpRequired,
}: LoginFormProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="glass-light w-full max-w-sm rounded-3xl p-8">
        <a href="/" className="text-[17px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </a>
        <h1 className="mt-6 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-[15px] text-muted">{subtitle}</p>

        <form action={authenticateAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="loginPath" value={loginPath} />
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? defaultRedirect} />

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[15px] text-red-600">
              {totpRequired
                ? "Código do autenticador ausente ou incorreto (ele expira a cada 30s) — e-mail e senha continuam os mesmos de antes."
                : "E-mail ou senha incorretos."}
            </p>
          ) : null}

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

          {role === "admin" && (
            <label className="flex flex-col gap-1.5 text-[15px] text-muted">
              Código do autenticador
              <input
                type="text"
                name="totpCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                required={totpRequired}
                placeholder={
                  totpRequired
                    ? "Obrigatório — 6 dígitos do seu app autenticador"
                    : "Informe o código se já configurou o autenticador; senão, deixe em branco"
                }
                className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[16px] text-foreground outline-none"
              />
            </label>
          )}

          <button
            type="submit"
            className="neu-primary mt-2 rounded-full px-4 py-2.5 text-[15px] font-medium text-white"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
