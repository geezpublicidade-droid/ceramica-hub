"use client";

import { useState } from "react";
import { deleteFaq, reorderFaqs, saveFaq } from "@/lib/actions/landing-editor";
import type { EditorFaq } from "@/lib/services/landing-editor-data";
import { Field, TabIntro, UpgradeNote, buttonClass, ghostButtonClass, inputClass, moveId, useSaver } from "../ui";
import type { TabProps } from "../types";

function FaqRow({ faq, ids, target }: { faq: EditorFaq; ids: string[]; target?: string }) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [active, setActive] = useState(faq.active);
  const { pending, message, run } = useSaver();

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <Field label="Pergunta">
        <input maxLength={160} value={question} onChange={(e) => setQuestion(e.target.value)} className={inputClass} />
      </Field>
      <div className="mt-3">
        <Field label="Resposta">
          <textarea rows={3} maxLength={800} value={answer} onChange={(e) => setAnswer(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Visível
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => saveFaq(target, { id: faq.id, question, answer, active }))} className={buttonClass}>
          Salvar
        </button>
        <button type="button" aria-label="Subir" disabled={pending} onClick={() => run(() => reorderFaqs(target, moveId(ids, faq.id, -1)), "Ordem atualizada.")} className={ghostButtonClass}>
          ↑
        </button>
        <button type="button" aria-label="Descer" disabled={pending} onClick={() => run(() => reorderFaqs(target, moveId(ids, faq.id, 1)), "Ordem atualizada.")} className={ghostButtonClass}>
          ↓
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => deleteFaq(target, faq.id), "Removida.")} className="tap text-[14px] font-medium text-red-700 hover:underline">
          Remover
        </button>
        {message && <span className={`text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </li>
  );
}

/** Perguntas frequentes: cadastrar, ordenar, ocultar e remover. Também alimenta os dados estruturados do Google. */
export function FaqTab({ data, target }: TabProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { pending, message, run } = useSaver();
  const ids = data.faqs.map((faq) => faq.id);

  if (!data.capabilities.faq) return <UpgradeNote>Perguntas frequentes fazem parte do plano Profissional ou superior.</UpgradeNote>;

  function add() {
    run(async () => {
      const result = await saveFaq(target, { question, answer });
      if (result.success) {
        setQuestion("");
        setAnswer("");
      }
      return result;
    }, "Pergunta adicionada.");
  }

  return (
    <div className="space-y-5">
      <TabIntro>Responda as dúvidas que mais travam um contato: agendamento, pagamento, estacionamento, convênios, horários.</TabIntro>
      <ul className="space-y-3">
        {data.faqs.map((faq) => (
          <FaqRow key={`${faq.id}-${faq.question}-${faq.answer}-${faq.active}`} faq={faq} ids={ids} target={target} />
        ))}
      </ul>
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-[14px] font-semibold">Nova pergunta</p>
        <div className="mt-3 space-y-3">
          <Field label="Pergunta">
            <input maxLength={160} value={question} onChange={(e) => setQuestion(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Resposta">
            <textarea rows={3} maxLength={800} value={answer} onChange={(e) => setAnswer(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <button type="button" disabled={pending} onClick={add} className={buttonClass}>
            Adicionar
          </button>
          {message && <span className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
        </div>
      </div>
    </div>
  );
}
