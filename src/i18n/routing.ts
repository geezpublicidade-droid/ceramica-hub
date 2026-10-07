import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en", "es", "zh"],
  defaultLocale: "pt",
  localePrefix: "as-needed",
  // Sem detecção automática por idioma do navegador: /planos é SEMPRE português, /en/planos inglês, /es/... espanhol.
  // (Com a detecção ligada, quem tinha o navegador em inglês era redirecionado de /planos para /en/planos.)
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
