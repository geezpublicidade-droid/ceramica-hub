import { auth } from "@/auth";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const ROLE_BY_PREFIX: { prefix: string; roles: ("business" | "business_staff" | "member" | "admin")[]; loginPath: string }[] = [
  { prefix: "/dashboard", roles: ["business", "business_staff"], loginPath: "/login" },
  { prefix: "/membro", roles: ["member"], loginPath: "/membro/login" },
  { prefix: "/admin", roles: ["admin"], loginPath: "/admin/login" },
];

// Rotas fora de src/app/[locale] — nunca passam pelo roteamento de idioma.
const NO_LOCALE_PATHS = ["/login"];

const intlMiddleware = createMiddleware(routing);

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

    // admin sem MFA configurado ainda: só pode acessar a tela de setup,
    // qualquer outra rota do admin redireciona pra lá primeiro.
    if (req.auth.user.role === "admin" && req.auth.user.mfaSetupRequired && pathname !== "/admin/mfa-setup") {
      return NextResponse.redirect(new URL("/admin/mfa-setup", req.nextUrl.origin));
    }

    return; // autorizado, rota interna nunca passa pelo next-intl
  }

  if (NO_LOCALE_PATHS.includes(pathname)) return;

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/dashboard/:path*", "/membro/:path*", "/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
