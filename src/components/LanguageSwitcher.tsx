"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABEL: Record<string, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
  zh: "中文",
};

const FULL_LABEL: Record<string, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  zh: "中文",
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative text-[14px] font-medium text-muted ${className}`}>
      <span className="sr-only">{t("label")}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:text-foreground"
      >
        {LABEL[locale]}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="glass-light absolute right-0 top-full mt-2 flex flex-col gap-0.5 rounded-2xl border border-border p-1.5">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                router.replace(pathname, { locale: loc });
                setOpen(false);
              }}
              aria-current={loc === locale}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-left transition-colors ${
                loc === locale ? "bg-primary/10 text-primary" : "text-foreground hover:bg-white/60"
              }`}
            >
              {FULL_LABEL[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
