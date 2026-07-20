"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Business, BusinessService } from "@/data/businesses";
import type { OwnedPhoto, OwnedPromotion, VirtualTourScene } from "@/lib/services/platform";
import type { PlanLimits } from "@/lib/plan-limits";
import {
  updateBusinessProfile,
  addService,
  deleteService,
  addPhoto,
  deletePhoto,
  addPromotion,
  deactivatePromotion,
  addVirtualTourScene,
  deleteVirtualTourScene,
} from "@/lib/actions/business-profile";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

function UpgradeNotice({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-xl bg-primary/5 px-4 py-3 text-[13px] text-foreground">
      <p className="font-medium">Esse recurso faz parte de um plano superior.</p>
      <p className="mt-1 text-muted">{message}</p>
      <Link href="/#planos" className="mt-2 inline-block font-medium text-primary hover:underline">
        Conhecer o plano →
      </Link>
    </div>
  );
}

export function EditPageManager({
  business,
  services,
  photos,
  promotions,
  virtualTourScenes,
  limits,
}: {
  business: Business;
  services: BusinessService[];
  photos: OwnedPhoto[];
  promotions: OwnedPromotion[];
  virtualTourScenes: VirtualTourScene[];
  limits: PlanLimits;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [profile, setProfile] = useState({
    description: business.description,
    logoUrl: business.logo ?? "",
    coverPhotoUrl: business.coverPhoto ?? "",
    instagram: business.instagram,
    websiteUrl: business.websiteUrl ?? "",
    openingHours: business.openingHours ?? "",
    videoUrl: business.videoUrl ?? "",
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newService, setNewService] = useState({ name: "", description: "" });
  const [serviceError, setServiceError] = useState<string | null>(null);

  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [newPromotion, setNewPromotion] = useState({ title: "", description: "", couponCode: "", validUntil: "" });
  const [promotionError, setPromotionError] = useState<string | null>(null);

  const [newScene, setNewScene] = useState({ label: "", imageUrl: "" });
  const [sceneError, setSceneError] = useState<string | null>(null);

  const activePromotions = promotions.filter((p) => p.active);

  function saveProfile() {
    setProfileError(null);
    setProfileSaved(false);
    startTransition(async () => {
      const result = await updateBusinessProfile(profile);
      if (!result.success) {
        setProfileError(result.error);
        return;
      }
      setProfileSaved(true);
      router.refresh();
    });
  }

  function submitService() {
    setServiceError(null);
    startTransition(async () => {
      const result = await addService(newService.name, newService.description);
      if (!result.success) {
        setServiceError(result.error);
        return;
      }
      setNewService({ name: "", description: "" });
      router.refresh();
    });
  }

  function submitPhoto() {
    setPhotoError(null);
    startTransition(async () => {
      const result = await addPhoto(newPhotoUrl);
      if (!result.success) {
        setPhotoError(result.error);
        return;
      }
      setNewPhotoUrl("");
      router.refresh();
    });
  }

  function submitScene() {
    setSceneError(null);
    startTransition(async () => {
      const result = await addVirtualTourScene(newScene.label, newScene.imageUrl);
      if (!result.success) {
        setSceneError(result.error);
        return;
      }
      setNewScene({ label: "", imageUrl: "" });
      router.refresh();
    });
  }

  function submitPromotion() {
    setPromotionError(null);
    startTransition(async () => {
      const result = await addPromotion(newPromotion);
      if (!result.success) {
        setPromotionError(result.error);
        return;
      }
      setNewPromotion({ title: "", description: "", couponCode: "", validUntil: "" });
      router.refresh();
    });
  }

  return (
    <div className="mt-10 flex flex-col gap-10">
      {/* Perfil */}
      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-[15px] font-semibold text-foreground">Perfil da página</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label>
            <span className={labelClass}>Descrição</span>
            <textarea
              className={inputClass}
              rows={3}
              value={profile.description}
              onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>URL da logo</span>
            <input
              className={inputClass}
              value={profile.logoUrl}
              onChange={(e) => setProfile((p) => ({ ...p, logoUrl: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>URL da foto de capa</span>
            <input
              className={inputClass}
              value={profile.coverPhotoUrl}
              onChange={(e) => setProfile((p) => ({ ...p, coverPhotoUrl: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>Instagram</span>
            <input
              className={inputClass}
              value={profile.instagram}
              onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>Site</span>
            <input
              className={inputClass}
              value={profile.websiteUrl}
              onChange={(e) => setProfile((p) => ({ ...p, websiteUrl: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>Horário de atendimento</span>
            <input
              className={inputClass}
              value={profile.openingHours}
              onChange={(e) => setProfile((p) => ({ ...p, openingHours: e.target.value }))}
            />
          </label>
          <label>
            <span className={labelClass}>Vídeo em destaque (URL)</span>
            <input
              className={inputClass}
              disabled={!limits.videoAllowed}
              value={profile.videoUrl}
              onChange={(e) => setProfile((p) => ({ ...p, videoUrl: e.target.value }))}
              placeholder={limits.videoAllowed ? "" : "Disponível no plano Experiência"}
            />
          </label>
          {!limits.videoAllowed && (
            <UpgradeNotice message="Vídeo em destaque é um recurso do plano Experiência." />
          )}
          {profileError && <p className="text-[13px] text-red-600">{profileError}</p>}
          {profileSaved && <p className="text-[13px] text-primary">Salvo.</p>}
          <button
            type="button"
            disabled={isPending}
            onClick={saveProfile}
            className="neu-primary self-start rounded-full px-6 py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
          >
            Salvar perfil
          </button>
        </div>
      </section>

      {/* Serviços */}
      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-[15px] font-semibold text-foreground">
          Serviços ({services.length}
          {Number.isFinite(limits.maxServices) ? `/${limits.maxServices}` : ""})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-[14px] font-medium text-foreground">{service.name}</p>
                {service.description && <p className="text-[13px] text-muted">{service.description}</p>}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await deleteService(service.id); router.refresh(); })}
                className="text-[12px] text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        {services.length >= limits.maxServices ? (
          <UpgradeNotice message={`Seu plano permite até ${limits.maxServices} serviços.`} />
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <input
              className={inputClass}
              placeholder="Nome do serviço"
              value={newService.name}
              onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Descrição (opcional)"
              value={newService.description}
              onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
            />
            {serviceError && <p className="text-[13px] text-red-600">{serviceError}</p>}
            <button
              type="button"
              disabled={isPending}
              onClick={submitService}
              className="neu self-start rounded-full px-5 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
            >
              + Adicionar serviço
            </button>
          </div>
        )}
      </section>

      {/* Galeria */}
      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-[15px] font-semibold text-foreground">
          Galeria ({photos.length}/{limits.maxPhotos})
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-24 w-full object-cover" />
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await deletePhoto(photo.id); router.refresh(); })}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        {photos.length >= limits.maxPhotos ? (
          <UpgradeNotice message={`Seu plano permite até ${limits.maxPhotos} imagens na galeria.`} />
        ) : (
          <div className="mt-4 flex gap-2">
            <input
              className={inputClass}
              placeholder="URL da imagem"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={submitPhoto}
              className="neu shrink-0 rounded-full px-5 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
            >
              Adicionar
            </button>
          </div>
        )}
        {photoError && <p className="mt-2 text-[13px] text-red-600">{photoError}</p>}
      </section>

      {/* Visita Virtual 360° */}
      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-[15px] font-semibold text-foreground">
          Visite nossa sala — visita virtual 360° ({virtualTourScenes.length})
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Tire fotos panorâmicas 360° com o celular (modo &quot;Photo Sphere&quot; ou &quot;Panorama&quot;) de cada
          ambiente e cole a URL de cada uma abaixo. Visitantes vão poder olhar ao redor e trocar de cômodo.
        </p>

        {virtualTourScenes.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {virtualTourScenes.map((scene) => (
              <div key={scene.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <p className="text-[14px] font-medium text-foreground">{scene.label}</p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(async () => { await deleteVirtualTourScene(scene.id); router.refresh(); })}
                  className="text-[12px] text-red-600"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}

        {!limits.virtualTourAllowed ? (
          <UpgradeNotice message="Visita virtual 360° é um recurso do plano Experiência." />
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <input
              className={inputClass}
              placeholder="Nome da cena (ex: Recepção, Sala 215)"
              value={newScene.label}
              onChange={(e) => setNewScene((s) => ({ ...s, label: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="URL da foto panorâmica 360°"
              value={newScene.imageUrl}
              onChange={(e) => setNewScene((s) => ({ ...s, imageUrl: e.target.value }))}
            />
            {sceneError && <p className="text-[13px] text-red-600">{sceneError}</p>}
            <button
              type="button"
              disabled={isPending}
              onClick={submitScene}
              className="neu self-start rounded-full px-5 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
            >
              + Adicionar cena
            </button>
          </div>
        )}
      </section>

      {/* Promoções */}
      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-[15px] font-semibold text-foreground">
          Promoções ativas ({activePromotions.length}
          {limits.maxPromotions > 0 ? `/${limits.maxPromotions}` : ""})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {activePromotions.map((promo) => (
            <div key={promo.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-[14px] font-medium text-foreground">{promo.title}</p>
                {promo.description && <p className="text-[13px] text-muted">{promo.description}</p>}
                {promo.couponCode && <p className="text-[12px] text-primary">Cupom: {promo.couponCode}</p>}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await deactivatePromotion(promo.id); router.refresh(); })}
                className="text-[12px] text-red-600"
              >
                Encerrar
              </button>
            </div>
          ))}
        </div>

        {limits.maxPromotions === 0 ? (
          <UpgradeNotice message="Promoções fazem parte dos planos Profissional, Destaque e Experiência." />
        ) : activePromotions.length >= limits.maxPromotions ? (
          <UpgradeNotice message={`Seu plano permite até ${limits.maxPromotions} promoção(ões) ativa(s) por vez.`} />
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <input
              className={inputClass}
              placeholder="Título da promoção"
              value={newPromotion.title}
              onChange={(e) => setNewPromotion((p) => ({ ...p, title: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Descrição"
              value={newPromotion.description}
              onChange={(e) => setNewPromotion((p) => ({ ...p, description: e.target.value }))}
            />
            <input
              className={inputClass}
              disabled={!limits.couponsAllowed}
              placeholder={limits.couponsAllowed ? "Código do cupom (opcional)" : "Cupons: disponível no plano Destaque"}
              value={newPromotion.couponCode}
              onChange={(e) => setNewPromotion((p) => ({ ...p, couponCode: e.target.value }))}
            />
            {promotionError && <p className="text-[13px] text-red-600">{promotionError}</p>}
            <button
              type="button"
              disabled={isPending}
              onClick={submitPromotion}
              className="neu self-start rounded-full px-5 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
            >
              + Criar promoção
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
