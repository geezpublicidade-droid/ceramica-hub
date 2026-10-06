"use client";

import { useState } from "react";
import type { BusinessService } from "@/data/businesses";
import { createService, removeService, reorderServices, updateServiceDetails } from "@/lib/actions/landing-editor";
import { UploadButton } from "../UploadButton";
import { Field, TabIntro, buttonClass, ghostButtonClass, inputClass, moveId, useSaver } from "../ui";
import type { TabProps } from "../types";

function ServiceRow({ service, ids, target }: { service: BusinessService; ids: string[]; target?: string }) {
  const [form, setForm] = useState({
    name: service.name,
    description: service.description ?? "",
    price: service.startingPrice?.toString() ?? "",
    duration: service.duration ?? "",
    ctaLabel: service.ctaLabel ?? "",
    photoUrl: service.photo ?? "",
    active: service.active !== false,
  });
  const { pending, message, run } = useSaver();

  function save() {
    run(() =>
      updateServiceDetails(target, {
        id: service.id,
        name: form.name,
        description: form.description || null,
        startingPrice: form.price === "" ? null : Number(form.price),
        duration: form.duration || null,
        ctaLabel: form.ctaLabel || null,
        photoUrl: form.photoUrl || null,
        active: form.active,
      }),
    );
  }

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <input maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Preço inicial (R$, opcional)">
          <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Duração (opcional)" hint='Ex.: "45 min"'>
          <input maxLength={30} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Texto do botão (opcional)" hint='Padrão: "Saiba mais"'>
          <input maxLength={30} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className={inputClass} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Descrição curta">
          <textarea rows={2} maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {form.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.photoUrl} alt="" className="h-14 w-20 rounded-md object-cover" />
        )}
        <UploadButton target={target} label={form.photoUrl ? "Trocar foto" : "Enviar foto"} onUploaded={(url) => setForm((current) => ({ ...current, photoUrl: url }))} />
        {form.photoUrl && (
          <button type="button" onClick={() => setForm({ ...form, photoUrl: "" })} className={ghostButtonClass}>
            Sem foto
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
          Visível
        </label>
        <button type="button" disabled={pending} onClick={save} className={buttonClass}>
          Salvar
        </button>
        <button type="button" aria-label="Subir" disabled={pending} onClick={() => run(() => reorderServices(target, moveId(ids, service.id, -1)), "Ordem atualizada.")} className={ghostButtonClass}>
          ↑
        </button>
        <button type="button" aria-label="Descer" disabled={pending} onClick={() => run(() => reorderServices(target, moveId(ids, service.id, 1)), "Ordem atualizada.")} className={ghostButtonClass}>
          ↓
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => removeService(target, service.id), "Removido.")} className="tap text-[14px] font-medium text-red-700 hover:underline">
          Remover
        </button>
        {message && <span className={`text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </li>
  );
}

/** Serviços/produtos da landing: o clique de cada um abre o WhatsApp com a mensagem do serviço. */
export function ServicesTab({ data, target }: TabProps) {
  const [name, setName] = useState("");
  const { pending, message, run } = useSaver();
  const ids = data.services.map((service) => service.id);
  const limit = data.capabilities.maxServices;

  function add() {
    run(async () => {
      const result = await createService(target, name);
      if (result.success) setName("");
      return result;
    }, "Serviço adicionado.");
  }

  return (
    <div className="space-y-5">
      <TabIntro>
        Cadastre de 3 a 6 serviços principais; a página mostra os 4 primeiros e libera o restante em &quot;Ver todos&quot;.{" "}
        {Number.isFinite(limit) ? `Seu plano permite até ${limit} (${data.services.length} em uso).` : `${data.services.length} cadastrados.`}
      </TabIntro>
      <ul className="space-y-3">
        {data.services.map((service) => (
          <ServiceRow key={`${service.id}-${service.name}-${service.photo}-${service.active}`} service={service} ids={ids} target={target} />
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
        <div className="min-w-56 flex-1">
          <Field label="Novo serviço">
            <input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <button type="button" disabled={pending} onClick={add} className={buttonClass}>
          Adicionar
        </button>
        {message && <span className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
