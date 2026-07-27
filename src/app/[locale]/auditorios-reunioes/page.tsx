import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getActiveMeetingSpaces } from "@/lib/services/meeting-spaces";
import { buildSocialMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Auditorios");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/auditorios-reunioes" },
    ...buildSocialMetadata({ title, description, locale, path: "/auditorios-reunioes" }),
  };
}

export default async function AuditoriosReunioesPage() {
  const t = await getTranslations("Auditorios");
  const spaces = await getActiveMeetingSpaces();

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

          {spaces.length === 0 ? (
            <p className="mt-14 text-[16px] text-muted">{t("empty")}</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {spaces.map((space) => (
                <div key={space.id} className="glass-card-light overflow-hidden rounded-3xl">
                  {space.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={space.photoUrl} alt={space.name} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-6">
                    <h2 className="text-[19px] font-semibold tracking-tight">{space.name}</h2>
                    <p className="mt-1 text-[14px] text-muted">
                      {space.spaceType === "auditorio" ? "Auditório" : "Sala de reunião"}
                      {space.capacity && ` · até ${space.capacity} ${t("capacity")}`}
                      {space.towerName && ` · ${space.towerName}`}
                    </p>
                    {space.description && <p className="mt-3 text-[16px] leading-relaxed text-muted">{space.description}</p>}
                    {space.equipment && <p className="mt-2 text-[14px] text-muted">{space.equipment}</p>}
                    {space.pricingInfo && <p className="mt-2 text-[14px] font-medium text-foreground">{space.pricingInfo}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {space.contactWhatsapp && (
                        <a
                          href={`https://wa.me/${space.contactWhatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
                        >
                          {t("requestInfo")}
                        </a>
                      )}
                      {!space.contactWhatsapp && space.contactLink && (
                        <a
                          href={space.contactLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
                        >
                          {t("requestInfo")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
