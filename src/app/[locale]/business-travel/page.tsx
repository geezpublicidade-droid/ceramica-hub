import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getActiveHotels } from "@/lib/services/hotels";
import { buildSocialMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("BusinessTravel");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/business-travel" },
    ...buildSocialMetadata({ title, description, locale, path: "/business-travel" }),
  };
}

export default async function BusinessTravelPage() {
  const t = await getTranslations("BusinessTravel");
  const hotels = await getActiveHotels();

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

          {hotels.length === 0 ? (
            <p className="mt-14 text-[16px] text-muted">{t("empty")}</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="glass-card-light overflow-hidden rounded-3xl">
                  {hotel.coverPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hotel.coverPhotoUrl} alt={hotel.name} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-6">
                    <h2 className="text-[19px] font-semibold tracking-tight">{hotel.name}</h2>
                    {hotel.address && <p className="mt-1 text-[14px] text-muted">{hotel.address}</p>}
                    {hotel.description && <p className="mt-3 text-[16px] leading-relaxed text-muted">{hotel.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {hotel.whatsapp && (
                        <a
                          href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu rounded-full px-5 py-2.5 text-[14px] font-medium text-foreground"
                        >
                          {t("whatsapp")}
                        </a>
                      )}
                      {hotel.bookingLink && (
                        <a
                          href={hotel.bookingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
                        >
                          {t("bookingLink")}
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
