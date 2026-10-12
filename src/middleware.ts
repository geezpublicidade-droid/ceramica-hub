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
// Redirect 307 (temporário) pra não transferir/perder ranking. Só a home de cada idioma
// e sessões de admin passam; /preview e as APIs públicas também ficam fechados.
const LOCALE_PREFIX = /^\/(en|es|zh)(?=\/|$)/;
const COMING_SOON_OPEN = [/^\/?$/];

// Link secreto de pré-visualização: /preview?previewkey=<PREVIEW_ACCESS_KEY> grava um cookie
// httpOnly e libera o site inteiro naquele navegador, sem conta. Sem a env, o recurso fica desligado.
const PREVIEW_PARAM = "previewkey";
const PREVIEW_COOKIE = "hub-preview";
const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function sameKey(a: string | undefined | null, b: string | undefined) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function hasPreviewAccess(req: NextRequest) {
  return sameKey(req.cookies.get(PREVIEW_COOKIE)?.value, process.env.PREVIEW_ACCESS_KEY);
}

// Chave certa na URL: grava o cookie e redireciona para a mesma URL sem a chave.
function previewKeyGrant(req: NextRequest) {
  if (!sameKey(req.nextUrl.searchParams.get(PREVIEW_PARAM), process.env.PREVIEW_ACCESS_KEY)) return null;
  const clean = req.nextUrl.clone();
  clean.searchParams.delete(PREVIEW_PARAM);
  const res = NextResponse.redirect(clean);
  res.cookies.set(PREVIEW_COOKIE, process.env.PREVIEW_ACCESS_KEY!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_COOKIE_MAX_AGE,
  });
  return res;
}

function comingSoonRedirect(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const localePrefix = LOCALE_PREFIX.exec(pathname)?.[0] ?? "";
  const bare = pathname.slice(localePrefix.length);
  if (COMING_SOON_OPEN.some((re) => re.test(bare))) return null;
  return NextResponse.redirect(new URL(localePrefix || "/", req.nextUrl.origin), 307);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdmin = req.auth?.user.role === "admin";

  const grant = previewKeyGrant(req);
  if (grant) return grant;
  const canPreview = isAdmin || hasPreviewAccess(req);

  // APIs de dados públicos (busca, anúncios, QR): só com sessão até o lançamento.
  if (pathname.startsWith("/api/")) return req.auth || canPreview ? undefined : NextResponse.json({ error: "not_found" }, { status: 404 });

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

  if (!canPreview) {
    const redirect = comingSoonRedirect(req);
    if (redirect) return redirect;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/dashboard/:path*", "/membro/:path*", "/admin/:path*", "/api/search/:path*", "/api/ads/:path*", "/api/business/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
