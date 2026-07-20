import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ROLE_BY_PREFIX: { prefix: string; role: "business" | "member" | "admin"; loginPath: string }[] = [
  { prefix: "/dashboard", role: "business", loginPath: "/login" },
  { prefix: "/membro", role: "member", loginPath: "/membro/login" },
  { prefix: "/admin", role: "admin", loginPath: "/admin/login" },
];

// gate temporário de pré-lançamento — pede só a senha (usuário pode ser
// qualquer coisa), pra dar acesso ao sócio antes do site ficar público
function hasValidSitePassword(req: Request) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return true;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
  const separatorIndex = decoded.indexOf(":");
  const password = separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);
  return password === sitePassword;
}

export default auth((req) => {
  if (!hasValidSitePassword(req)) {
    return new NextResponse("Acesso restrito", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Cerâmica Hub"' },
    });
  }

  const { pathname } = req.nextUrl;
  const match = ROLE_BY_PREFIX.find(({ prefix }) => pathname.startsWith(prefix));
  if (!match) return;

  // rotas de login/cadastro de cada área ficam fora do prefixo protegido
  // (ex: /membro/login, /admin/login não devem exigir sessão)
  if (pathname === match.loginPath || pathname.endsWith("/cadastro")) return;

  if (!req.auth || req.auth.user.role !== match.role) {
    const loginUrl = new URL(match.loginPath, req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
