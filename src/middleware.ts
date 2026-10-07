import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { LOGIN_PATH_BY_AREA } from "@/lib/login-paths";

const ROLE_BY_PREFIX: { prefix: string; roles: ("business" | "business_staff" | "member" | "admin")[]; loginPath: string }[] = [
  { prefix: "/dashboard", roles: ["business", "business_staff"], loginPath: LOGIN_PATH_BY_AREA.business },
  { prefix: "/membro", roles: ["member"], loginPath: LOGIN_PATH_BY_AREA.member },
  { prefix: "/admin", roles: ["admin"], loginPath: LOGIN_PATH_BY_AREA.admin },
];

// Rotas fora de src/app/[locale] — nunca passam pelo roteamento de idioma.
const NO_LOCALE_PATHS = ["/login", "/entrar", "/esqueci-senha", "/redefinir-senha"];

const intlMiddleware = createMiddleware(routing);

// Pré-lançamento: qualquer URL pública (as que o Google já indexou) leva ao "Em breve".
// Redirect 307 (temporário) pra não transferir/perder ranking. Quem está logado e a home
// de cada idioma passam; /preview segue acessível por link direto (noindex).
const LOCALE_PREFIX = /^\/(en|es|zh)(?=\/|$)/;
const COMING_SOON_OPEN = [/^\/?$/, /^\/preview(\/|$)/, /^\/empresa\/[^/]+\/preview$/];

function comingSoonRedirect(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const localePrefix = LOCALE_PREFIX.exec(pathname)?.[0] ?? "";
  const bare = pathname.slice(localePrefix.length);
  if (COMING_SOON_OPEN.some((re) => re.test(bare))) return null;
  return NextResponse.redirect(new URL(localePrefix || "/", req.nextUrl.origin), 307);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const match = ROLE_BY_PREFIX.find(({ prefix }) => pathname.startsWith(prefix));

  if (match) {
    // rotas de login/cadastro de cada área ficam fora do prefixo protegido
    // (ex: /membro/login, /admin/login não devem exigir sessão)
    if (pathname === match.loginPath || pathname.endsWith("/cadastro")) return;

    if (!req.auth || !match.roles.includes(req.auth.user.role)) {
      const loginUrl = new URL(match.loginPath, req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return; // autorizado, rota interna nunca passa pelo next-intl
  }

  if (NO_LOCALE_PATHS.includes(pathname) || pathname.startsWith("/proposta/") || pathname.startsWith("/descadastrar/")) return;

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/dashboard/:path*", "/membro/:path*", "/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
