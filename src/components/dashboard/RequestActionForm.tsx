"use client";

import { useState, useTransition } from "react";
import { requestActionAction } from "@/lib/actions/action-requests";
import { ACTION_REQUEST_TYPES, ACTION_REQUEST_LABEL, type ActionRequestType } from "@/lib/action-requests";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";

/** Botão "Solicitar ação" do portal de resultados -- abre um chamado rotulado pra equipe. */
export function RequestActionForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActionRequestType>("destaque_home");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await requestActionAction({ type, message });
      if (!result.success) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setFeedback({ ok: true, text: "Pedido enviado! Nossa equipe responde pelo Suporte." });
      setMessage("");
      setOpen(false);
    });
  }

  return (
    <div className="glass-light rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Quer mais resultados?</p>
          <p className="mt-2 max-w-md text-[15px] text-muted">
            Peça uma ação à nossa equipe: destaque, post, e-mail ou campanha para a sua empresa.
          </p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white">
            Solicitar ação
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
          <label>
            <span className="text-[14px] font-medium text-foreground">O que você quer?</span>
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as ActionRequestType)}>
              {ACTION_REQUEST_TYPES.map((key) => (
                <option key={key} value={key}>
                  {ACTION_REQUEST_LABEL[key]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[14px] font-medium text-foreground">Detalhes (opcional)</span>
            <textarea className={inputClass} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="neu-primary rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-60">
              {isPending ? "Enviando..." : "Enviar pedido"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="neu rounded-full px-6 py-2.5 text-[15px] font-medium text-foreground">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {feedback && <p className={`mt-4 text-[15px] ${feedback.ok ? "text-foreground" : "text-red-700"}`}>{feedback.text}</p>}
    </div>
  );
}
