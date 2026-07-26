"use client";

import { useState, useTransition } from "react";
import { inviteStaff, removeStaff } from "@/lib/actions/business-staff";

export function StaffManagement({ staff }: { staff: { id: string; email: string; name: string }[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteStaff({ email, password, name });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEmail("");
      setPassword("");
      setName("");
    });
  }

  function handleRemove(staffId: string) {
    setError(null);
    startTransition(() => void removeStaff(staffId));
  }

  return (
    <div className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Equipe</p>
      <p className="mt-2 text-[13px] text-muted">
        Pessoas com acesso ao painel pra editar a página, mas sem poder mexer em cobrança ou
        excluir a conta — isso fica só com você.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {staff.length === 0 && <p className="text-[13px] text-muted">Nenhum membro adicionado ainda.</p>}
        {staff.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-white/70 px-4 py-2.5">
            <div>
              <p className="text-[13px] font-medium text-foreground">{member.name}</p>
              <p className="text-[12px] text-muted">{member.email}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRemove(member.id)}
              className="text-[12px] font-medium text-red-600 disabled:opacity-60"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleInvite} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <label className="sm:col-span-1">
          <span className="text-[12px] text-muted">Nome</span>
          <input
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="sm:col-span-1">
          <span className="text-[12px] text-muted">E-mail</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="sm:col-span-1">
          <span className="text-[12px] text-muted">Senha provisória</span>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="neu-primary h-fit rounded-full px-5 py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Adicionar"}
        </button>
      </form>

      {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
