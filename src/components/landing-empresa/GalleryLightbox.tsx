"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Rotate3d, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { VirtualTourViewer } from "@/components/VirtualTourViewer";
import { logLandingEvent } from "@/lib/actions/log-search";
import type { VirtualTourScene } from "@/lib/services/platform";

export type GalleryItem = { id: string; type: "photo" | "video"; url: string; alt: string; caption?: string | null };

type GalleryLightboxProps = {
  businessId: string;
  items: GalleryItem[];
  tourScenes?: VirtualTourScene[];
};

type Open = { kind: "item"; index: number } | { kind: "tour" } | null;

/** Grade de mídia (fotos, vídeos e o tile do tour 3D) com lightbox: Esc fecha, setas navegam. */
export function GalleryLightbox({ businessId, items, tourScenes = [] }: GalleryLightboxProps) {
  const t = useTranslations("LandingEmpresa");
  const [open, setOpen] = useState<Open>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasTour = tourScenes.length > 0;

  const openItem = useCallback(
    (index: number) => {
      setOpen({ kind: "item", index });
      void logLandingEvent(businessId, items[index].type === "video" ? "video_played" : "gallery_viewed", items[index].id);
    },
    [businessId, items],
  );

  const step = useCallback(
    (delta: number) => setOpen((current) => (current?.kind === "item" ? { kind: "item", index: (current.index + delta + items.length) % items.length } : current)),
    [items.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  const current = open?.kind === "item" ? items[open.index] : null;
  const visible = hasTour ? items.slice(0, 3) : items.slice(0, 4);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openItem(index)}
            aria-label={item.type === "video" ? t("galleryPlay") : t("galleryOpen")}
            className="group relative aspect-[4/3] overflow-hidden rounded-md bg-surface"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.type === "photo" && <img src={item.url} alt={item.alt} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
            {item.type === "video" && (
              <>
                <video src={item.url} preload="metadata" muted className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Play className="h-10 w-10 text-white" fill="currentColor" aria-hidden="true" />
                </span>
              </>
            )}
          </button>
        ))}
        {hasTour && (
          <button
            type="button"
            onClick={() => setOpen({ kind: "tour" })}
            className="relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-md bg-foreground p-4 text-center text-white"
          >
            <Rotate3d className="h-9 w-9" aria-hidden="true" />
            <span className="text-[17px] font-semibold">{t("galleryTour")}</span>
            <span className="text-[13px] text-white/75">{t("galleryTourText")}</span>
          </button>
        )}
      </div>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          <button ref={closeRef} type="button" aria-label={t("galleryClose")} onClick={() => setOpen(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          {current && items.length > 1 && (
            <>
              <button type="button" aria-label={t("galleryPrev")} onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" aria-label={t("galleryNext")} onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <div className="max-h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {current?.type === "photo" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.alt} className="mx-auto max-h-[82vh] w-auto rounded-md object-contain" />
            )}
            {current?.type === "video" && <video src={current.url} controls autoPlay className="mx-auto max-h-[82vh] w-full rounded-md" />}
            {open.kind === "tour" && <VirtualTourViewer scenes={tourScenes} />}
            {current?.caption && <p className="mt-3 text-center text-[15px] text-white/80">{current.caption}</p>}
          </div>
        </div>
      )}
    </>
  );
}
