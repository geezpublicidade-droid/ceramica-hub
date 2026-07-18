import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ROLE_BY_PREFIX: { prefix: string; role: "business" | "member" | "admin"; loginPath: string }[] = [
  { prefix: "/dashboard", role: "business", loginPath: "/login" },
  { prefix: "/membro", role: "member", loginPath: "/membro/login" },
  { prefix: "/admin", role: "admin", loginPath: "/admin/login" },
];

export default auth((req) => {
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
  matcher: ["/dashboard/:path*", "/membro/:path*", "/admin/:path*"],
};
