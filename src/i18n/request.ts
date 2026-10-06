import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import ptMessages from "../../messages/pt.json";

type Messages = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Messages => typeof value === "object" && value !== null && !Array.isArray(value);

/** Mescla `override` sobre `base` em profundidade: chave que falta no idioma cai no português em vez de quebrar a página. */
function withFallback(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = isPlainObject(value) && isPlainObject(base[key]) ? withFallback(base[key] as Messages, value) : value;
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const localeMessages = (await import(`../../messages/${locale}.json`)).default as Messages;

  return {
    locale,
    messages: locale === routing.defaultLocale ? localeMessages : withFallback(ptMessages as Messages, localeMessages),
  };
});
