import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { EventInterestLink } from "@/components/EventInterestLink";
import { getUpcomingEvents } from "@/lib/services/events";
import { buildSocialMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("ForumNegocios");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/forum-de-negocios" },
    ...buildSocialMetadata({ title, description, locale, path: "/forum-de-negocios" }),
  };
}

export default async function ForumDeNegociosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("ForumNegocios");
  const events = await getUpcomingEvents();

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" });

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

          {events.length === 0 ? (
            <p className="mt-14 text-[16px] text-muted">{t("empty")}</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {events.map((event) => (
                <div key={event.id} className="glass-card-light overflow-hidden rounded-3xl">
                  {event.coverPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.coverPhotoUrl} alt={event.title} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-6">
                    <p className="text-[13px] font-medium uppercase tracking-wide text-primary">
                      {dateFormatter.format(new Date(event.startsAt))}
                    </p>
                    <h2 className="mt-1 text-[19px] font-semibold tracking-tight">{event.title}</h2>
                    {event.location && <p className="mt-1 text-[14px] text-muted">{event.location}</p>}
                    {event.description && <p className="mt-3 text-[16px] leading-relaxed text-muted">{event.description}</p>}
                    {event.capacity && (
                      <p className="mt-2 text-[13px] text-muted">
                        {t("capacityPrefix")} {event.capacity} {t("capacity")}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {event.whatsapp && (
                        <EventInterestLink
                          href={`https://wa.me/${event.whatsapp.replace(/\D/g, "")}`}
                          eventId={event.id}
                          className="neu rounded-full px-5 py-2.5 text-[14px] font-medium text-foreground"
                        >
                          {t("whatsapp")}
                        </EventInterestLink>
                      )}
                      {event.registrationLink && (
                        <EventInterestLink
                          href={event.registrationLink}
                          eventId={event.id}
                          className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
                        >
                          {t("registrationLink")}
                        </EventInterestLink>
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
