"use client";

import { useState } from "react";
import { categories } from "@/data/businesses";
import { uploadComprovante } from "@/lib/actions/register-business";
import { MAX_DRAFT_PHOTOS, type ProfileDraft } from "@/lib/profile/draft";
import type { TowerOption } from "@/app/[locale]/cadastro/page";
import { FaqEditor, PhotoStrip, ServicesEditor, ShortListEditor } from "./ListEditors";
import { ScheduleEditor } from "./ScheduleEditor";
import { Field, ImageUpload, ImportedBadge, inputClass, StepHeader } from "./wizard-ui";

const realCategories = categories.filter((c) => c !== "Todas");

export type AccountState = {
  responsibleName: string;
  email: string;
  password: string;
  phone: string;
  towerId: string;
  floor: string;
  roomNumber: string;
  comprovantePath: string;
  comprovanteFileName: string;
};

export type StepProps = {
  draft: ProfileDraft;
  setDraft: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  /** campos que a importação do Google preencheu */
  fromGoogle: Set<keyof ProfileDraft>;
};
type AccountProps = { account: AccountState; setAccount: <K extends keyof AccountState>(key: K, value: AccountState[K]) => void };

export function AccountStep({ account, setAccount, draft, setDraft }: AccountProps & Pick<StepProps, "draft" | "setDraft">) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 2 · Acesso" title="Quem vai gerenciar o perfil" hint="Estes dados criam seu login. O WhatsApp é onde os clientes vão falar com você." />
      <Field label="Nome do responsável">
        <input className={inputClass} value={account.responsibleName} onChange={(e) => setAccount("responsibleName", e.target.value)} />
      </Field>
      <Field label="E-mail">
        <input type="email" className={inputClass} value={account.email} onChange={(e) => setAccount("email", e.target.value)} />
      </Field>
      <Field label="Senha" hint="Mínimo de 8 caracteres.">
        <input type="password" className={inputClass} value={account.password} onChange={(e) => setAccount("password", e.target.value)} />
      </Field>
      <Field label="WhatsApp (com DDD)">
        <input className={inputClass} inputMode="tel" value={account.phone} onChange={(e) => setAccount("phone", e.target.value)} placeholder="(11) 90000-0000" />
      </Field>
      <Field label="CNPJ ou CPF (opcional)">
        <input className={inputClass} value={draft.document} onChange={(e) => setDraft("document", e.target.value)} />
      </Field>
    </div>
  );
}

export function BusinessStep({ draft, setDraft, fromGoogle }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 3 · Sua empresa" title="Conte o que você faz" hint="É o que aparece no topo do seu perfil e nas buscas." />
      <Field label="Nome da empresa">
        <ImportedBadge show={fromGoogle.has("name")} />
        <input className={inputClass} value={draft.name} onChange={(e) => setDraft("name", e.target.value)} />
      </Field>
      <Field label="Categoria">
        <ImportedBadge show={fromGoogle.has("category")} />
        <select className={inputClass} value={draft.category} onChange={(e) => setDraft("category", e.target.value)}>
          <option value="">Selecione</option>
          {realCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Descrição" hint="2 a 4 frases: o que oferece, para quem e o que diferencia você.">
        <ImportedBadge show={fromGoogle.has("shortDescription")} />
        <textarea className={inputClass} rows={4} maxLength={600} value={draft.shortDescription} onChange={(e) => setDraft("shortDescription", e.target.value)} />
      </Field>
      <div>
        <span className="text-[15px] font-medium text-foreground">Diferenciais</span>
        <p className="mb-2 text-[13px] text-muted">Ex.: “Atendimento com hora marcada”, “Estacionamento próprio”.</p>
        <ShortListEditor items={draft.differentials} onChange={(next) => setDraft("differentials", next)} max={6} placeholder="Um diferencial" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Anos de atuação (opcional)">
          <input
            type="number"
            min={0}
            max={200}
            className={inputClass}
            value={draft.yearsInBusiness ?? ""}
            onChange={(e) => setDraft("yearsInBusiness", e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))))}
          />
        </Field>
        <label className="flex items-center gap-3 pt-7 text-[16px] text-foreground">
          <input type="checkbox" checked={draft.byAppointment} onChange={(e) => setDraft("byAppointment", e.target.checked)} />
          Atendo somente com hora marcada
        </label>
      </div>
    </div>
  );
}

export function LocationStep({ account, setAccount, draft, setDraft, fromGoogle, towers }: AccountProps & StepProps & { towers: TowerOption[] }) {
  const [upload, setUpload] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const tower = towers.find((t) => t.id === account.towerId);

  async function sendComprovante(file: File | undefined) {
    if (!file) return;
    setUpload({ busy: true, error: null });
    const body = new FormData();
    body.set("file", file);
    const result = await uploadComprovante(body).catch(() => ({ success: false as const, error: "Falha no envio." }));
    if (result.success) {
      setAccount("comprovantePath", result.path);
      setAccount("comprovanteFileName", file.name);
    }
    setUpload({ busy: false, error: result.success ? null : result.error });
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 4 · Local e horários" title="Onde e quando atender" />
      <Field label="Torre">
        <select className={inputClass} value={account.towerId} onChange={(e) => setAccount("towerId", e.target.value)}>
          <option value="">Selecione a torre</option>
          {towers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      {tower && <p className="-mt-2 text-[14px] text-muted">{tower.address}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Andar">
          <input className={inputClass} value={account.floor} onChange={(e) => setAccount("floor", e.target.value)} />
        </Field>
        <Field label="Sala">
          <input className={inputClass} value={account.roomNumber} onChange={(e) => setAccount("roomNumber", e.target.value)} />
        </Field>
      </div>
      <Field label="Comprovante de instalação na torre" hint="Contrato, conta de consumo ou similar. PDF, JPG, PNG ou WEBP até 10MB. Não aparece no site.">
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className={inputClass} onChange={(e) => void sendComprovante(e.target.files?.[0])} />
        {upload.busy && <span className="mt-1 block text-[13px] text-muted">Enviando…</span>}
        {account.comprovanteFileName && !upload.busy && <span className="mt-1 block text-[13px] text-primary">Enviado: {account.comprovanteFileName}</span>}
        {upload.error && <span className="mt-1 block text-[13px] text-red-600">{upload.error}</span>}
      </Field>
      <div>
        <span className="text-[15px] font-medium text-foreground">Horário de funcionamento</span>
        <ImportedBadge show={fromGoogle.has("schedule")} />
        <div className="mt-2">
          <ScheduleEditor value={draft.schedule} onChange={(next) => setDraft("schedule", next)} />
        </div>
      </div>
      <Field label="Estacionamento (opcional)">
        <input className={inputClass} value={draft.parkingInfo} maxLength={200} onChange={(e) => setDraft("parkingInfo", e.target.value)} placeholder="Ex.: Estacionamento conveniado ao lado" />
      </Field>
      <Field label="Acessibilidade (opcional)">
        <input className={inputClass} value={draft.accessibilityInfo} maxLength={200} onChange={(e) => setDraft("accessibilityInfo", e.target.value)} placeholder="Ex.: Entrada acessível para cadeirantes" />
      </Field>
    </div>
  );
}

export function PresenceStep({ draft, setDraft, fromGoogle }: StepProps) {
  const links: [keyof ProfileDraft, string, string][] = [
    ["instagram", "Instagram", "@suaempresa"],
    ["websiteUrl", "Site", "https://"],
    ["facebookUrl", "Facebook", "https://facebook.com/..."],
    ["tiktokUrl", "TikTok", "https://tiktok.com/@..."],
    ["youtubeUrl", "YouTube", "https://youtube.com/..."],
  ];
  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 5 · Imagem e redes" title="Como sua empresa aparece" hint="Logo e capa dão identidade. Fotos reais passam confiança." />
      <div className="grid gap-5 sm:grid-cols-2">
        <ImageUpload label="Logo" value={draft.logoUrl} onChange={(url) => setDraft("logoUrl", url)} round />
        <ImageUpload label="Foto de capa" value={draft.coverPhotoUrl} onChange={(url) => setDraft("coverPhotoUrl", url)} />
      </div>
      <GalleryUpload draft={draft} setDraft={setDraft} />
      {links.map(([key, label, placeholder]) => (
        <Field key={key} label={label}>
          <ImportedBadge show={fromGoogle.has(key)} />
          <input className={inputClass} value={String(draft[key] ?? "")} placeholder={placeholder} onChange={(e) => setDraft(key, e.target.value as never)} />
        </Field>
      ))}
    </div>
  );
}

function GalleryUpload({ draft, setDraft }: Pick<StepProps, "draft" | "setDraft">) {
  return (
    <div>
      <ImageUpload label={`Galeria (${draft.photos.length}/${MAX_DRAFT_PHOTOS})`} value="" onChange={(url) => url && draft.photos.length < MAX_DRAFT_PHOTOS && setDraft("photos", [...draft.photos, url])} />
      <PhotoStrip urls={draft.photos} onChange={(next) => setDraft("photos", next)} />
    </div>
  );
}

export function OfferStep({ draft, setDraft }: Pick<StepProps, "draft" | "setDraft">) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader eyebrow="Etapa 6 · Serviços e dúvidas" title="O que você oferece" hint="Tudo que preencher fica guardado. O que cabe no seu plano já aparece; o resto entra quando você fizer upgrade." />
      <section>
        <h3 className="mb-2 text-[16px] font-semibold text-foreground">Serviços ou produtos</h3>
        <ServicesEditor items={draft.services} onChange={(next) => setDraft("services", next)} />
      </section>
      <section>
        <h3 className="mb-2 text-[16px] font-semibold text-foreground">Perguntas frequentes</h3>
        <FaqEditor items={draft.faqs} onChange={(next) => setDraft("faqs", next)} />
      </section>
    </div>
  );
}
