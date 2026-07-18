import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export const metadata = { title: "Entrar — Cerâmica Hub" };

async function authenticate(formData: FormData) {
  "use server";

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="glass-light w-full max-w-sm rounded-3xl p-8">
        <a href="/" className="text-[15px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </a>
        <h1 className="mt-6 text-xl font-semibold text-foreground">Entrar</h1>
        <p className="mt-1 text-[13px] text-muted">Acesse o painel da sua empresa.</p>

        <form action={authenticate} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />

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
