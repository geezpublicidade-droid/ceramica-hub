"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BackLink } from "@/components/nav/BackLink";
import { requestPasswordReset } from "@/lib/actions/password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await requestPasswordReset(email);
      setDone(true);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-4">
          <BackLink href="/login" label="Voltar ao login" />
        </div>
        <div className="glass-light rounded-3xl p-8">
          <Link href="/" className="text-[17px] font-semibold tracking-tight text-foreground">
            Cerâmica <span className="text-primary">Hub</span>
          </Link>
          <h1 className="mt-6 text-xl font-semibold text-foreground">Esqueci minha senha</h1>

          {done ? (
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Se esse e-mail estiver cadastrado, você vai receber um link pra criar uma senha nova em
              alguns minutos. O link expira em 1 hora.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[15px] text-muted">
                Informe o e-mail da sua empresa e enviamos um link pra redefinir a senha.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-[15px] text-muted">
                  E-mail
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neu rounded-xl border-0 bg-transparent px-4 py-2.5 text-[16px] text-foreground outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isPending}
                  className="neu-primary mt-2 rounded-full px-4 py-2.5 text-[15px] font-medium text-white disabled:opacity-60"
                >
                  {isPending ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
