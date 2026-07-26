"use client";

import { useState, useTransition } from "react";
import { updateAdminRole, removeAdmin } from "@/lib/actions/admin-users";
import type { AdminRole } from "@/auth";

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super admin",
  admin: "Admin (geral)",
  financeiro: "Financeiro",
  comercial: "Comercial",
  moderador: "Moderador",
};

const ROLE_OPTIONS = Object.keys(ROLE_LABEL) as AdminRole[];

export function AdminUserRow({
  admin,
  isSelf,
}: {
  admin: { id: string; email: string; role: AdminRole };
  isSelf: boolean;
}) {
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(next: AdminRole) {
    setRole(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAdminRole(admin.id, next);
      if (!result.success) {
        setError(result.error);
        setRole(admin.role);
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeAdmin(admin.id);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-5">
      <div>
        <p className="text-[16px] font-medium text-foreground">
          {admin.email} {isSelf && <span className="text-muted">(você)</span>}
        </p>
        {error && <p className="text-[14px] text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[15px] text-foreground disabled:opacity-60"
          value={role}
          disabled={isPending || isSelf}
          onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        {!isSelf && !confirmingRemove && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmingRemove(true)}
            className="rounded-full border border-red-200 px-4 py-2 text-[15px] font-medium text-red-600 disabled:opacity-60"
          >
            Remover
          </button>
        )}
        {confirmingRemove && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={handleRemove}
              className="rounded-full bg-red-600 px-4 py-2 text-[15px] font-medium text-white disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmingRemove(false)}
              className="rounded-full px-3 py-2 text-[15px] text-muted"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
