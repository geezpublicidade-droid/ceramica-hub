import { getTranslations } from "next-intl/server";
import { PartnerLeadForm } from "@/components/PartnerLeadForm";
import { localizedPath } from "@/lib/discovery-params";
import { getCategoryOffers, getSellableCategories } from "@/lib/services/category-offers";
import { formatCents } from "@/lib/utils";

const TYPE_KEYS = ["leader", "premium", "featured"] as const;
type TypeKey = (typeof TYPE_KEYS)[number];

function isTypeKey(value: string): value is TypeKey {
  return (TYPE_KEYS as readonly string[]).includes(value);
}

type CategoryOffersSectionProps = {
  locale: string;
  /** caminho da categoria vindo da URL (`?categoria=`); vazio = só o seletor */
  selectedPath?: string;
};

/**
 * "Destaque na sua categoria": o anunciante escolhe a categoria, vê as posições (Líder, Premium,
 * Destaque) com preço e vagas livres hoje, e pede contato já com a posição na mensagem.
 * Preço vem de Produtos; sem preço definido aparece "sob consulta" (nada fixo no código).
 */
export async function CategoryOffersSection({ locale, selectedPath }: CategoryOffersSectionProps) {
  const t = await getTranslations("CategoryOffers");
  const [options, selected] = await Promise.all([
    getSellableCategories(locale),
    selectedPath ? getCategoryOffers(selectedPath, locale) : Promise.resolve(null),
  ]);

  return (
    <section id="destaque-categoria" className="bg-background px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-semibold leading-tight tracking-tight">{t("title")}</h2>
        <p className="mt-3 max-w-2xl text-[17px] text-muted">{t("subtitle")}</p>

        <form action={`${localizedPath(locale, "/planos")}#destaque-categoria`} method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="categoria">
            {t("pickLabel")}
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={selected?.path ?? ""}
            className="min-h-12 flex-1 rounded-xl border border-border bg-white px-4 text-[16px] text-foreground"
          >
            <option value="">{t("pickPlaceholder")}</option>
            {options.map((option) => (
              <option key={option.path} value={option.path}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="neu-primary min-h-12 rounded-full px-7 text-[16px] font-medium text-white">
            {t("seePositions")}
          </button>
        </form>

        {selectedPath && !selected && <p className="mt-6 text-[16px] text-muted">{t("notFound")}</p>}

        {selected && (
          <div className="mt-10">
            <h3 className="text-[20px] font-semibold">{t("positionsIn", { category: selected.label })}</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {selected.offers
                .filter((offer) => isTypeKey(offer.typeKey))
                .map((offer) => {
                  const key = offer.typeKey as TypeKey;
                  const soldOut = offer.freeSlots === 0;
                  return (
                    <article key={key} className="glass-card-light flex flex-col gap-3 rounded-3xl p-6">
                      <span className="self-start rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                        {t(`types.${key}.badge`)}
                      </span>
                      <h4 className="text-[20px] font-semibold">{t(`types.${key}.name`)}</h4>
                      <p className="text-[15px] leading-relaxed text-muted">{t(`types.${key}.description`)}</p>
                      <p className="mt-auto text-[22px] font-semibold text-foreground">
                        {offer.monthlyPriceCents != null ? t("pricePerMonth", { price: formatCents(offer.monthlyPriceCents) }) : t("priceOnRequest")}
                      </p>
                      <p className={`text-[14px] ${soldOut ? "text-primary" : "text-muted"}`}>
                        {soldOut ? t("soldOut") : t("slotsFree", { free: offer.freeSlots, total: offer.maxSlots })}
                      </p>
                    </article>
                  );
                })}
            </div>

            <div className="mt-10 max-w-xl">
              <h3 className="mb-4 text-[20px] font-semibold">{t("requestTitle")}</h3>
              <PartnerLeadForm defaultMessage={t("requestMessage", { category: selected.label })} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
