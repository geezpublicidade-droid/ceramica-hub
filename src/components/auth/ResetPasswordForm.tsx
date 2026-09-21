"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPasswordWithToken } from "@/lib/actions/password-reset";

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Link inválido. Peça um novo link de redefinição.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordWithToken(token, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="glass-light rounded-3xl p-8">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-foreground">
            <img src="/images/logo-ceramica-hub.png" alt="" className="h-7 w-7" />
            Cerâmica <span className="text-primary">Hub</span>
          </Link>
          <h1 className="mt-6 text-xl font-semibold text-foreground">Criar nova senha</h1>

          {done ? (
            <>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Senha redefinida com sucesso.
              </p>
              <Link
                href="/login"
                className="neu-primary mt-6 inline-block rounded-full px-4 py-2.5 text-[15px] font-medium text-white"
              >
                Entrar
              </Link>
            </>
          ) : !token ? (
            <p className="mt-4 text-[15px] leading-relaxed text-red-600">
              Link inválido ou incompleto. Peça um novo link em{" "}
              <Link href="/esqueci-senha" className="underline">
                Esqueci minha senha
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {error && <p className="text-[15px] text-red-600">{error}</p>}
              <label className="flex flex-col gap-1.5 text-[15px] text-muted">
                Nova senha
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[16px] text-foreground outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[15px] text-muted">
                Confirmar nova senha
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[16px] text-foreground outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="neu-primary mt-2 rounded-full px-4 py-2.5 text-[15px] font-medium text-white disabled:opacity-60"
              >
                {isPending ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
