import { Lock, MapPin, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Link } from "@/i18n/navigation";
import type { LandingContext } from "./context";
import { ClaimProfileForm } from "./ClaimProfileForm";

/**
 * Perfil do plano gratuito: simples e elegante. Nome, logo, categoria e localização — nada de contato, serviços ou galeria.
 * Nunca fala em "empresa que não paga": o convite é para reivindicar o perfil (quando ainda não tem dono validado) e
 * há uma vitrine discreta dos recursos profissionais.
 */
export async function BasicProfile({ ctx }: { ctx: LandingContext }) {
  const [t, tPage, tCategories] = await Promise.all([getTranslations("LandingEmpresa"), getTranslations("EmpresaPage"), getTranslations("categories")]);
  const { business } = ctx;
  const features = [t("proApresentacao"), t("proServicos"), t("proGaleria"), t("proWhatsapp")];

  return (
    <section className="bg-[#fbf9f6]">
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-6 pb-16 pt-32 text-center sm:pt-36">
        <Link href="/empresas" className="text-[13px] font-medium text-muted transition hover:text-foreground">
          ← {tPage("backToDirectory")}
        </Link>
        <BusinessAvatar business={business} className="h-28 w-28 rounded-md bg-white shadow-sm ring-1 ring-black/5" textClassName="text-[34px] font-semibold text-primary" />
        <h1 className="max-w-2xl text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight text-foreground">{business.name}</h1>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[15px] text-foreground/75">
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
            {tCategories(business.category)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            {business.floor}
          </span>
        </div>
        <FavoriteButton businessId={business.id} />

        {!business.ownerValidated && (
          <div className="mt-4 w-full max-w-xl rounded-md border border-black/[0.08] bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-[18px] font-semibold tracking-tight">{t("claimTitle")}</h2>
            <p className="mx-auto mt-1.5 max-w-md text-[14.5px] leading-relaxed text-foreground/70">{t("claimLead")}</p>
            <div className="mt-4 flex justify-center">
              <ClaimProfileForm businessId={business.id} businessName={business.name} />
            </div>
          </div>
        )}

        <div className="mt-6 w-full max-w-xl text-left">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted">{t("proFeatures")}</p>
          <ul className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 rounded-md border border-dashed border-black/15 px-3 py-2 text-[13.5px] text-muted">
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
