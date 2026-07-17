import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { opportunityTypeLabels } from "@/data/opportunities";
import { benefitKindLabels } from "@/data/benefits";
import {
  getAllBusinesses,
  getBusinessById,
  getRelatedBusinesses,
  getOpportunities,
  getBenefits,
} from "@/lib/services/platform";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const businesses = await getAllBusinesses();
  return businesses.map((business) => ({ id: business.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusinessById(id);
  if (!business) return {};

  const title = `${business.name} — Cerâmica Hub`;
  const description = business.description;

  return {
    title,
    description,
    alternates: { canonical: `/empresa/${business.id}` },
    openGraph: { title, description, type: "profile" },
  };
}

function instagramUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const { id } = await params;
  const business = await getBusinessById(id);
  if (!business) notFound();

  const [related, allOpportunities, allBenefits] = await Promise.all([
    getRelatedBusinesses(business),
    getOpportunities(),
    getBenefits(),
  ]);

  const opportunities = allOpportunities.filter((o) => o.businessId === business.id);
  const benefits = allBenefits.filter((b) => b.businessId === business.id);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-surface px-6 pb-16 pt-32 text-foreground">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/#empresas"
              className="text-[13px] font-medium text-muted transition-colors hover:text-foreground"
            >
              ← Voltar ao diretório
            </Link>

            <div className="glass-light mt-8 rounded-3xl p-8 sm:p-10">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <BusinessAvatar
                  business={business}
                  className="h-20 w-20 rounded-2xl bg-white"
                  textClassName="text-[22px] font-semibold"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-tight">
                      {business.name}
                    </h1>
                    {business.featured && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] text-muted">
                    {business.category} · {business.floor}
                  </p>
                </div>
              </div>

              <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-foreground/80">
                {business.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={buildWhatsAppLink(business.phone, business.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-primary rounded-full px-6 py-3 text-[14px] font-medium text-white"
                >
                  Falar no WhatsApp
                </a>
                <a
                  href={instagramUrl(business.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu rounded-full px-6 py-3 text-[14px] font-medium text-foreground"
                >
                  Ver Instagram
                </a>
              </div>
            </div>
          </div>
        </section>

        {(opportunities.length > 0 || benefits.length > 0) && (
          <section className="bg-surface px-6 py-16">
            <div className="mx-auto max-w-4xl space-y-10">
              {opportunities.length > 0 && (
                <div>
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
                    Oportunidades
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {opportunities.map((opportunity) => (
                      <div key={opportunity.id} className="glass-card-light rounded-2xl p-5">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          {opportunityTypeLabels[opportunity.type]}
                        </span>
                        <p className="mt-3 text-[15px] font-semibold tracking-tight">
                          {opportunity.title}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                          {opportunity.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {benefits.length > 0 && (
                <div>
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
                    Benefícios
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {benefits.map((benefit) => (
                      <div key={benefit.id} className="glass-card-light rounded-2xl p-5">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          {benefitKindLabels[benefit.kind]}
                        </span>
                        <p className="mt-3 text-[15px] font-semibold tracking-tight">{benefit.title}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                          {benefit.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="bg-background px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.2em] text-muted">
                Também em {business.category}
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {related.map((candidate) => (
                  <Link
                    key={candidate.id}
                    href={`/empresa/${candidate.id}`}
                    className="glass-card-light group flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/20"
                  >
                    <BusinessAvatar
                      business={candidate}
                      className="h-11 w-11 rounded-xl bg-white"
                      textClassName="text-[13px] font-semibold text-foreground"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold tracking-tight">
                        {candidate.name}
                      </p>
                      <p className="truncate text-[12px] text-muted">{candidate.floor}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <CinematicFooter />
    </>
  );
}
