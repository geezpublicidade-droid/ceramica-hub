import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { LandingPageEmpresa } from "@/components/landing-empresa/LandingPageEmpresa";
import { localizedUrl } from "@/lib/seo";
import { buildLandingContext } from "@/lib/services/landing-context";
import { getBusinessBySlug } from "@/lib/services/platform";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

// pré-visualização do rascunho: depende da sessão, nunca é cacheada nem indexada
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Pré-visualização da landing com o rascunho. Só a própria empresa e administradores veem; qualquer outra pessoa recebe 404. */
export default async function LandingPreviewPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const business = await getBusinessBySlug(slug, locale);
  if (!business) notFound();

  const session = await auth();
  const allowed = session?.user?.role === "admin" || session?.user?.businessId === business.id;
  if (!allowed) notFound();

  const tCategories = await getTranslations("categories");
  const ctx = await buildLandingContext(business, localizedUrl(locale, `/empresa/${business.slug}`), tCategories(business.category), {
    locale,
    allowDraft: true,
  });
  const draft = ctx.data.config.status === "draft";

  return (
    <>
      <Header />
      <div className="fixed inset-x-0 top-[72px] z-30 bg-foreground px-4 py-2 text-center text-[13px] font-medium text-white">
        Pré-visualização{draft ? " — rascunho, o público ainda não vê esta versão" : " — esta é a versão publicada"} · {business.name}
      </div>
      <main className="flex-1">
        <LandingPageEmpresa ctx={ctx} />
      </main>
      <CinematicFooter />
    </>
  );
}
