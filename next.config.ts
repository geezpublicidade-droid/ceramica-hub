import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// img-src precisa ser permissivo (https: em vez de domínio fixo) porque
// empresas cadastram URL de logo/capa livremente (RegisterWizard) -- não há
// um host único pra travar sem quebrar foto real já cadastrada.
//
// connect-src inclui o Supabase Storage porque o viewer de tour virtual
// (@photo-sphere-viewer/core) busca as imagens do panorama via fetch(), não
// via <img> -- então cai em connect-src, não em img-src.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async redirects() {
    // "Cafeterias e padarias" foi dividida em duas subcategorias (migration 0072)
    return [
      {
        source: "/categoria/alimentacao/cafeterias-e-padarias",
        destination: "/categoria/alimentacao/cafeterias",
        permanent: true,
      },
      {
        source: "/:locale(en|es|zh)/categoria/alimentacao/cafeterias-e-padarias",
        destination: "/:locale/categoria/alimentacao/cafeterias",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
