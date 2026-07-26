"use client";

import { useState, useTransition } from "react";
import { createAdmin } from "@/lib/actions/admin-users";
import type { AdminRole } from "@/auth";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[16px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[15px] font-medium text-foreground";

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "admin", label: "Admin (geral)" },
  { value: "financeiro", label: "Financeiro" },
  { value: "comercial", label: "Comercial" },
  { value: "moderador", label: "Moderador" },
  { value: "super_admin", label: "Super admin (acesso total)" },
];

export function NewAdminForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAdmin({ email, password, role });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEmail("");
      setPassword("");
      setRole("admin");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Novo admin</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label>
          <span className={labelClass}>E-mail</span>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Senha provisória</span>
          <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Papel</span>
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-[15px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[16px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Criando..." : "Criar admin"}
      </button>
    </form>
  );
}
