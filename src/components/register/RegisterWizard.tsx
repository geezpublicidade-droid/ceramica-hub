"use client";

import { useState, useTransition } from "react";
import { categories } from "@/data/businesses";
import { registerBusiness } from "@/lib/actions/register-business";
import type { TowerOption } from "@/app/cadastro/page";

const realCategories = categories.filter((c) => c !== "Todas");

type ServiceDraft = { name: string; description: string };

type FormState = {
  name: string;
  responsibleName: string;
  email: string;
  password: string;
  phone: string;
  document: string;
  category: string;
  shortDescription: string;
  towerId: string;
  floor: string;
  roomNumber: string;
  logoUrl: string;
  coverPhotoUrl: string;
  instagram: string;
  websiteUrl: string;
  openingHours: string;
  services: ServiceDraft[];
  termsAccepted: boolean;
  privacyAccepted: boolean;
  imageUsageAuthorized: boolean;
  addressConfirmed: boolean;
};

const initialState: FormState = {
  name: "",
  responsibleName: "",
  email: "",
  password: "",
  phone: "",
  document: "",
  category: "",
  shortDescription: "",
  towerId: "",
  floor: "",
  roomNumber: "",
  logoUrl: "",
  coverPhotoUrl: "",
  instagram: "",
  websiteUrl: "",
  openingHours: "",
  services: [{ name: "", description: "" }],
  termsAccepted: false,
  privacyAccepted: false,
  imageUsageAuthorized: false,
  addressConfirmed: false,
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

export function RegisterWizard({ towers }: { towers: TowerOption[] }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedTower = towers.find((t) => t.id === form.towerId);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateService(index: number, patch: Partial<ServiceDraft>) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!form.name.trim()) return "Informe o nome da empresa.";
      if (!form.responsibleName.trim()) return "Informe o nome do responsável.";
      if (!form.email.trim()) return "Informe o e-mail.";
      if (form.password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
      if (!form.phone.trim()) return "Informe o WhatsApp.";
      if (!form.category) return "Selecione uma categoria.";
    }
    if (current === 2) {
      if (!form.towerId) return "Selecione a torre.";
      if (!form.floor.trim()) return "Informe o andar.";
      if (!form.roomNumber.trim()) return "Informe a sala.";
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    if (!form.termsAccepted || !form.privacyAccepted || !form.addressConfirmed) {
      setError("É necessário aceitar os termos, a política de privacidade e confirmar o funcionamento no endereço.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await registerBusiness(form);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-border bg-white/70 px-8 py-12 text-center">
        <h2 className="text-[1.4rem] font-semibold text-foreground">Cadastro recebido com sucesso.</h2>
        <p className="mt-3 text-[15px] text-muted">
          Nossa equipe verificará os dados antes de publicar sua página.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-white/70 px-6 py-8 sm:px-8">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Etapa 1 · Dados da empresa</p>
          <label>
            <span className={labelClass}>Nome da empresa</span>
            <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Nome do responsável</span>
            <input
              className={inputClass}
              value={form.responsibleName}
              onChange={(e) => update("responsibleName", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>E-mail</span>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Crie uma senha de acesso</span>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label>
            <span className={labelClass}>WhatsApp</span>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="11912345678"
            />
          </label>
          <label>
            <span className={labelClass}>CNPJ ou CPF profissional</span>
            <input
              className={inputClass}
              value={form.document}
              onChange={(e) => update("document", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Categoria</span>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Selecione</option>
              {realCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Breve descrição</span>
            <textarea
              className={inputClass}
              rows={3}
              value={form.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Etapa 2 · Localização</p>
          <label>
            <span className={labelClass}>Torre</span>
            <select
              className={inputClass}
              value={form.towerId}
              onChange={(e) => update("towerId", e.target.value)}
            >
              <option value="">Selecione a torre</option>
              {towers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {selectedTower && (
            <p className="text-[13px] text-muted">Endereço: {selectedTower.address}</p>
          )}
          <label>
            <span className={labelClass}>Andar</span>
            <input className={inputClass} value={form.floor} onChange={(e) => update("floor", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>Sala</span>
            <input
              className={inputClass}
              value={form.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Etapa 3 · Página gratuita</p>
          <label>
            <span className={labelClass}>URL da logo (opcional por enquanto)</span>
            <input className={inputClass} value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} />
          </label>
          <label>
            <span className={labelClass}>URL da foto de capa (opcional por enquanto)</span>
            <input
              className={inputClass}
              value={form.coverPhotoUrl}
              onChange={(e) => update("coverPhotoUrl", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Instagram</span>
            <input
              className={inputClass}
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              placeholder="@suaempresa"
            />
          </label>
          <label>
            <span className={labelClass}>Site (se possuir)</span>
            <input
              className={inputClass}
              value={form.websiteUrl}
              onChange={(e) => update("websiteUrl", e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Horário de atendimento</span>
            <input
              className={inputClass}
              value={form.openingHours}
              onChange={(e) => update("openingHours", e.target.value)}
              placeholder="Seg a sex, 9h às 18h"
            />
          </label>
          <div>
            <span className={labelClass}>Serviços (até 3)</span>
            <div className="mt-2 flex flex-col gap-3">
              {form.services.map((service, index) => (
                <div key={index} className="rounded-xl border border-border p-3">
                  <input
                    className={inputClass}
                    placeholder="Nome do serviço"
                    value={service.name}
                    onChange={(e) => updateService(index, { name: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Descrição curta (opcional)"
                    value={service.description}
                    onChange={(e) => updateService(index, { description: e.target.value })}
                  />
                </div>
              ))}
              {form.services.length < 3 && (
                <button
                  type="button"
                  onClick={() => update("services", [...form.services, { name: "", description: "" }])}
                  className="self-start text-[13px] font-medium text-primary"
                >
                  + Adicionar serviço
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Etapa 4 · Verificação</p>
          <label className="flex items-start gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.addressConfirmed}
              onChange={(e) => update("addressConfirmed", e.target.checked)}
            />
            Confirmo que minha empresa funciona no endereço informado.
          </label>
          <label className="flex items-start gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.termsAccepted}
              onChange={(e) => update("termsAccepted", e.target.checked)}
            />
            Li e aceito os{" "}
            <a href="/termos" target="_blank" className="text-primary underline">
              Termos de Uso
            </a>
            .
          </label>
          <label className="flex items-start gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.privacyAccepted}
              onChange={(e) => update("privacyAccepted", e.target.checked)}
            />
            Li e aceito a{" "}
            <a href="/privacidade" target="_blank" className="text-primary underline">
              Política de Privacidade
            </a>
            .
          </label>
          <label className="flex items-start gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.imageUsageAuthorized}
              onChange={(e) => update("imageUsageAuthorized", e.target.checked)}
            />
            Autorizo a exibição pública das informações e imagens enviadas.
          </label>
        </div>
      )}

      {error && <p className="mt-6 text-[13px] text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="neu rounded-full px-6 py-3 text-[14px] font-medium text-foreground"
          >
            Voltar
          </button>
        ) : (
          <span />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={goNext}
            className="neu-primary rounded-full px-6 py-3 text-[14px] font-medium text-white"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="neu-primary rounded-full px-6 py-3 text-[14px] font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Enviando..." : "Enviar cadastro"}
          </button>
        )}
      </div>
    </div>
  );
}
