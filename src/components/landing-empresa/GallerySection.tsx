import { getTranslations } from "next-intl/server";
import { SECTION_TITLE, type LandingContext } from "./context";
import { GalleryLightbox, type GalleryItem } from "./GalleryLightbox";

/** Galeria de fotos e vídeos com lightbox; tour 3D como tile (só Premium). Sem mídia, a seção some. */
export async function GallerySection({ ctx }: { ctx: LandingContext }) {
  const { gallery, videos, capabilities } = ctx.data;
  const tourScenes = capabilities.virtualTour ? ctx.tourScenes : [];
  if (gallery.length === 0 && videos.length === 0 && tourScenes.length === 0) return null;

  const t = await getTranslations("LandingEmpresa");
  const items: GalleryItem[] = [
    ...gallery.map((photo, index): GalleryItem => ({
      id: photo.id,
      type: "photo",
      url: photo.url,
      alt: photo.alt ?? t("galleryPhotoAlt", { name: ctx.business.name, index: index + 1 }),
      caption: photo.caption,
    })),
    ...videos.map((video): GalleryItem => ({ id: video.id, type: "video", url: video.url, alt: video.alt ?? ctx.business.name, caption: video.caption })),
  ];

  return (
    <section id="galeria" className="container-page py-12 sm:py-16">
      <h2 className={`mb-6 ${SECTION_TITLE}`}>{t("galleryTitle")}</h2>
      <GalleryLightbox businessId={ctx.business.id} items={items} tourScenes={tourScenes} />
    </section>
  );
}
