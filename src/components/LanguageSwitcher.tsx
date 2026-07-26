"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABEL: Record<string, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
  zh: "中文",
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={`flex items-center gap-1 text-[12px] font-medium text-muted ${className}`}>
      <span className="sr-only">{t("label")}</span>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === locale}
          className={`rounded-full px-2 py-1 transition-colors ${
            loc === locale ? "bg-primary/10 text-primary" : "hover:text-foreground"
          }`}
        >
          {LABEL[loc]}
        </button>
      ))}
    </div>
  );
}
