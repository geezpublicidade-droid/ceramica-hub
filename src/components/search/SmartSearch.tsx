"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  BadgeCheck,
  CornerDownLeft,
  Hotel,
  Home,
  Megaphone,
  Presentation,
  Search,
  Sparkles,
  Store,
  Tag,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { logSearchPerformed } from "@/lib/actions/log-search";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PopularSearches, ShortcutKey, SmartSearchResponse, Suggestion } from "@/lib/services/smart-search";

type SmartSearchProps = {
  variant: "hero" | "page";
  /** de onde veio a busca, para as métricas */
  source: "hero" | "smart_search";
  defaultValue?: string;
};

const SHORTCUT_ICON: Record<ShortcutKey, LucideIcon> = {
  hotels: Hotel,
  realEstate: Home,
  rooms: Presentation,
  forum: CalendarDays,
  advertise: Megaphone,
};

const TYPE_MS = 55;
const ERASE_MS = 28;
const HOLD_MS = 1500;
const DEBOUNCE_MS = 180;
const EMPTY_POPULAR: PopularSearches = { terms: [], categories: [] };
const EMPTY_SUGGESTIONS: Suggestion[] = [];

type Row = { key: string; href?: string; term?: string };

/**
 * Pesquisa inteligente: o campo "digita" exemplos sozinho, entende frases ("dentista implante torre park"),
 * tolera erro de digitação e sinônimos, mostra o que entendeu em chips e sugere categorias, empresas e atalhos.
 * Teclado: ↑ ↓ navegam, Enter abre, Esc fecha. Com "reduzir movimento" não há animação de digitação.
 */
export function SmartSearch({ variant, source, defaultValue = "" }: SmartSearchProps) {
  const t = useTranslations("SmartSearch");
  const locale = useLocale();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const listId = useId();

  const examples = useMemo(() => t("examples").split("|"), [t]);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SmartSearchResponse | null>(null);
  const [popular, setPopular] = useState<PopularSearches | null>(null);
  const [active, setActive] = useState(-1);
  const [typed, setTyped] = useState("");
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = value.trim();
  const hasQuery = query.length >= 2;
  const isHero = variant === "hero";

  // placeholder animado: digita, segura, apaga, próximo exemplo
  useEffect(() => {
    if (value || reducedMotion) return;
    let index = 0;
    let length = 0;
    let erasing = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const text = examples[index % examples.length];
      if (!erasing) {
        length += 1;
        setTyped(text.slice(0, length));
        if (length >= text.length) {
          erasing = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        length -= 1;
        setTyped(text.slice(0, Math.max(length, 0)));
        if (length <= 0) {
          erasing = false;
          index += 1;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, ERASE_MS);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [value, reducedMotion, examples]);

  // sugestões enquanto digita
  useEffect(() => {
    if (!hasQuery) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/smart?q=${encodeURIComponent(query)}&locale=${locale}`, { signal: controller.signal });
        if (res.ok) {
          setResponse((await res.json()) as SmartSearchResponse);
          setActive(-1);
        }
      } catch {
        // digitou de novo (abortou) ou ficou sem rede: mantém o que já estava na tela
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, hasQuery, locale]);

  // buscas em alta: carrega uma vez, na primeira vez que a pessoa clica no campo
  const loadPopular = useCallback(async () => {
    if (popular) return;
    setPopular(EMPTY_POPULAR);
    try {
      const res = await fetch(`/api/search/smart?popular=1&locale=${locale}`);
      if (res.ok) setPopular((await res.json()) as PopularSearches);
    } catch {
      // sem buscas em alta: o painel só não mostra essa parte
    }
  }, [popular, locale]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // o painel vive no <body> (o herói corta o que passa do contorno): acompanha a posição do campo
  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        left: rect.left,
        top: rect.bottom + 12,
        width: rect.width,
        maxHeight: Math.max(220, Math.min(window.innerHeight * 0.7, window.innerHeight - rect.bottom - 28)),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const showingSuggestions = hasQuery && response !== null;
  const suggestions = showingSuggestions ? response.suggestions : EMPTY_SUGGESTIONS;

  const rows: Row[] = useMemo(() => {
    if (hasQuery) return suggestions.map((suggestion, index) => ({ key: `s-${index}`, href: suggestion.href }));
    return [
      ...(popular?.terms ?? []).map((term) => ({ key: `t-${term}`, term })),
      ...(popular?.categories ?? []).map((category) => ({ key: `c-${category.href}`, href: category.href })),
    ];
  }, [hasQuery, suggestions, popular]);

  function go(href: string) {
    setOpen(false);
    if (query) void logSearchPerformed(query, source).catch(() => undefined);
    router.push(href);
  }

  function submitCurrent() {
    const row = active >= 0 ? rows[active] : undefined;
    if (row?.term) {
      setValue(row.term);
      void logSearchPerformed(row.term, source).catch(() => undefined);
      setOpen(false);
      router.push(`/empresas?q=${encodeURIComponent(row.term)}`);
      return;
    }
    if (row?.href) return go(row.href);
    go(hasQuery && response ? response.searchHref : query ? `/empresas?q=${encodeURIComponent(query)}` : "/empresas");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (rows.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      // -1 = nenhum item destacado (Enter envia o texto digitado)
      setActive((current) => ((current + 1 + step + rows.length + 1) % (rows.length + 1)) - 1);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const container = isHero
    ? "border border-white/25 bg-white/10 backdrop-blur-md"
    : "border border-border bg-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.25)]";
  const textColor = isHero ? "text-white placeholder:text-white/60" : "text-foreground placeholder:text-muted";
  const overlayColor = isHero ? "text-white/65" : "text-muted";

  const rowClass = (index: number) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${index === active ? "bg-primary/10" : "hover:bg-surface"}`;

  /** `index` só escalona a animação de entrada; a linha destacada é a posição na lista de sugestões. */
  function renderSuggestion(suggestion: Suggestion, index: number) {
    const row = suggestions.indexOf(suggestion);
    const common = { onMouseEnter: () => setActive(row), onClick: () => go(suggestion.href), role: "option" as const, "aria-selected": row === active };
    const motionProps = reducedMotion ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(index, 8) * 0.03, duration: 0.22 } };

    if (suggestion.type === "busca") {
      return (
        <motion.button key={`b-${index}`} type="button" className={rowClass(row)} {...common} {...motionProps}>
          <Search className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] uppercase tracking-wide text-muted">{t("searchFor")}</span>
            <span className="block truncate text-[16px] font-medium text-foreground">{suggestion.label}</span>
          </span>
          <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </motion.button>
      );
    }
    if (suggestion.type === "categoria") {
      return (
        <motion.button key={`c-${index}`} type="button" className={rowClass(row)} {...common} {...motionProps}>
          <Tag className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-medium text-foreground">{suggestion.label}</span>
            <span className="block truncate text-[13px] text-muted">{suggestion.sublabel}</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </motion.button>
      );
    }
    if (suggestion.type === "empresa") {
      return (
        <motion.button key={`e-${index}`} type="button" className={rowClass(row)} {...common} {...motionProps}>
          {suggestion.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo é upload externo (URL arbitrária)
            <img src={suggestion.logo} alt="" className="h-8 w-8 shrink-0 rounded-full border border-border bg-white object-contain" />
          ) : (
            <Store className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate text-[16px] font-medium text-foreground">
              <span className="truncate">{suggestion.label}</span>
              {suggestion.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t("verified")} />}
            </span>
            <span className="block truncate text-[13px] text-muted">{suggestion.sublabel}</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </motion.button>
      );
    }
    const Icon = SHORTCUT_ICON[suggestion.shortcut];
    return (
      <motion.button key={`a-${index}`} type="button" className={rowClass(row)} {...common} {...motionProps}>
        <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[16px] font-medium text-foreground">{t(`shortcuts.${suggestion.shortcut}`)}</span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </motion.button>
    );
  }

  const grouped = {
    busca: suggestions.filter((s) => s.type === "busca"),
    categoria: suggestions.filter((s) => s.type === "categoria"),
    empresa: suggestions.filter((s) => s.type === "empresa"),
    atalho: suggestions.filter((s) => s.type === "atalho"),
  };
  const groupTitle = "px-3 pb-1 pt-3 text-[12px] font-medium uppercase tracking-[0.14em] text-muted";
  const nothingFound = showingSuggestions && suggestions.every((s) => s.type === "busca");

  return (
    <div ref={wrapperRef} className="relative">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submitCurrent();
        }}
        className={`relative flex items-center gap-2 rounded-full p-1 pl-4 sm:p-1.5 sm:pl-5 ${container}`}
      >
        <Search className={`h-5 w-5 shrink-0 ${isHero ? "text-white/80" : "text-primary"}`} strokeWidth={1.75} aria-hidden="true" />
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label={t("ariaLabel")}
            autoComplete="off"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              void loadPopular();
            }}
            onKeyDown={onKeyDown}
            className={`w-full bg-transparent py-2.5 text-[15px] focus:outline-none sm:py-3 sm:text-[17px] ${textColor}`}
          />
          {!value && (
            <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 flex items-center text-[15px] sm:text-[17px] ${overlayColor}`}>
              <span className="truncate">{reducedMotion ? examples[0] : typed}</span>
              {!reducedMotion && <span className="smart-caret ml-0.5 inline-block h-[1.1em] w-px bg-current" />}
            </span>
          )}
        </div>
        <button type="submit" className="neu-primary shrink-0 rounded-full px-4 py-2.5 text-[14px] font-medium text-white sm:px-6 sm:py-3 sm:text-[15px]">
          {t("button")}
        </button>
        {loading && (
          <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-px overflow-hidden rounded-full">
            <span className="smart-loading block h-full w-1/3 bg-primary" />
          </span>
        )}
      </form>

      {typeof document !== "undefined" &&
        createPortal(
      <AnimatePresence>
        {open && anchor && (hasQuery ? showingSuggestions : rows.length > 0) && (
          <motion.div
            ref={panelRef}
            id={listId}
            style={{ left: anchor.left, top: anchor.top, width: anchor.width, maxHeight: anchor.maxHeight }}
            role="listbox"
            initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[100] overflow-y-auto rounded-3xl border border-border bg-white p-2 text-foreground shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)]"
          >
            {hasQuery && response ? (
              <>
                {response.chips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 px-3 pb-1 pt-2">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-[13px] text-muted">{t("understood")}</span>
                    {response.chips.map((chip, index) => (
                      <motion.span
                        key={`${chip.kind}-${chip.label}`}
                        initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary"
                      >
                        {chip.label}
                      </motion.span>
                    ))}
                  </div>
                )}

                {grouped.busca.map((suggestion) => renderSuggestion(suggestion, 0))}

                {grouped.categoria.length > 0 && <p className={groupTitle}>{t("categoriesTitle")}</p>}
                {grouped.categoria.map((suggestion, index) => renderSuggestion(suggestion, index + 1))}

                {grouped.empresa.length > 0 && <p className={groupTitle}>{t("companiesTitle")}</p>}
                {grouped.empresa.map((suggestion, index) => renderSuggestion(suggestion, index + 3))}

                {grouped.atalho.length > 0 && <p className={groupTitle}>{t("shortcutsTitle")}</p>}
                {grouped.atalho.map((suggestion, index) => renderSuggestion(suggestion, index + 6))}

                {nothingFound && (
                  <div className="px-3 py-3 text-[14px] text-muted">
                    <p>{t("noResults")}</p>
                    {response.didYouMean && (
                      <button
                        type="button"
                        onClick={() => setValue(response.didYouMean ?? "")}
                        className="mt-1 text-[15px] font-medium text-primary underline underline-offset-4"
                      >
                        {t("didYouMean", { suggestion: response.didYouMean })}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-border/70 px-3 pb-1 pt-2.5 text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("enterHint")}
                  </span>
                  <button type="button" onClick={() => go("/empresas")} className="font-medium text-primary hover:underline">
                    {t("viewAll")}
                  </button>
                </div>
              </>
            ) : (
              <>
                {(popular?.terms.length ?? 0) > 0 && (
                  <>
                    <p className={groupTitle}>{t("popularTitle")}</p>
                    <div className="flex flex-wrap gap-2 px-3 pb-2">
                      {popular?.terms.map((term, index) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setValue(term);
                            inputRef.current?.focus();
                          }}
                          onMouseEnter={() => setActive(index)}
                          className={`rounded-full border px-3.5 py-1.5 text-[14px] transition-colors ${active === index ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-foreground hover:border-primary/40"}`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {(popular?.categories.length ?? 0) > 0 && (
                  <>
                    <p className={groupTitle}>{t("popularCategoriesTitle")}</p>
                    {popular?.categories.map((category, index) => {
                      const row = (popular.terms.length) + index;
                      return (
                        <button key={category.href} type="button" onClick={() => go(category.href)} onMouseEnter={() => setActive(row)} className={rowClass(row)}>
                          <Tag className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{category.label}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
