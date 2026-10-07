"use client";

import { useState } from "react";
import { reviewProfileClaim } from "@/lib/actions/admin-claims";
import { buttonClass, ghostButtonClass, inputClass, useSaver } from "@/components/dashboard/landing/ui";

export type ClaimRow = {
  id: string;
  businessName: string;
  businessSlug: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewNote: string | null;
};

const STATUS = { pending: "Pendente", approved: "Aprovado", rejected: "Recusado" } as const;

function ClaimCard({ claim }: { claim: ClaimRow }) {
  const { pending, message, run } = useSaver();
  const [note, setNote] = useState("");
  return (
    <li className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold">{claim.businessName}</p>
          <p className="text-[13.5px] text-muted">
            {new Date(claim.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {STATUS[claim.status]}
          </p>
        </div>
        {claim.businessSlug && (
          <a href={`/empresa/${claim.businessSlug}`} target="_blank" rel="noopener noreferrer" className="text-[13.5px] font-semibold text-primary hover:underline">
            Ver perfil →
          </a>
        )}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="inline text-muted">Solicitante: </dt>
          <dd className="inline">{claim.name}</dd>
        </div>
        <div>
          <dt className="inline text-muted">E-mail: </dt>
          <dd className="inline">{claim.email}</dd>
        </div>
        {claim.phone && (
          <div>
            <dt className="inline text-muted">Telefone: </dt>
            <dd className="inline">{claim.phone}</dd>
          </div>
        )}
        {claim.role && (
          <div>
            <dt className="inline text-muted">Cargo: </dt>
            <dd className="inline">{claim.role}</dd>
          </div>
        )}
      </dl>
      {claim.message && <p className="mt-2 rounded-md bg-black/[0.03] p-3 text-[14px]">{claim.message}</p>}
      {claim.status === "pending" ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação da decisão (opcional)" maxLength={500} className={`${inputClass} !mt-0`} />
          </div>
          <button type="button" disabled={pending} onClick={() => run(() => reviewProfileClaim(claim.id, "approved", note), "Aprovado.")} className={buttonClass}>
            Aprovar
          </button>
          <button type="button" disabled={pending} onClick={() => run(() => reviewProfileClaim(claim.id, "rejected", note), "Recusado.")} className={ghostButtonClass}>
            Recusar
          </button>
        </div>
      ) : (
        claim.reviewNote && <p className="mt-3 text-[13.5px] text-muted">Decisão: {claim.reviewNote}</p>
      )}
      {message && (
        <p role="status" className={`mt-2 text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </li>
  );
}

export function ClaimsList({ claims }: { claims: ClaimRow[] }) {
  if (claims.length === 0) {
    return <p className="rounded-xl border border-dashed border-border bg-white/40 p-6 text-center text-[14px] text-muted">Nenhum pedido de reivindicação ainda.</p>;
  }
  return (
    <ul className="space-y-3">
      {claims.map((claim) => (
        <ClaimCard key={`${claim.id}-${claim.status}`} claim={claim} />
      ))}
    </ul>
  );
}
