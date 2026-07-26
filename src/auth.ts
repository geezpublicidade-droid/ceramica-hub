import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verify as verifyTotp } from "otplib";
import { createServiceClient } from "@/lib/supabase/server";

type Role = "business" | "business_staff" | "member" | "admin";
export type AdminRole = "super_admin" | "admin" | "financeiro" | "comercial" | "moderador";

const TABLE_BY_ROLE: Record<Role, "businesses" | "business_staff" | "members" | "admins"> = {
  business: "businesses",
  business_staff: "business_staff",
  member: "members",
  admin: "admins",
};

// Rate limiting sem serviço externo: conta tentativas falhas recentes por
// identifier (role:email) na tabela login_attempts antes de checar a senha.
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

type AuthorizedUser = {
  id: string;
  email: string;
  role: Role;
  businessId?: string;
  memberId?: string;
  adminRole?: AdminRole;
  isStaff?: boolean;
  mfaSetupRequired: boolean;
};

async function tryAuthenticate(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  password: string,
  role: Role,
  totpCode: unknown
): Promise<AuthorizedUser | null> {
  const { data: account } = await supabase
    .from(TABLE_BY_ROLE[role])
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!account) return null;

  const valid = await bcrypt.compare(password, account.password_hash);
  if (!valid) return null;

  // MFA obrigatório pra admin: se já configurado, exige código válido.
  // Se ainda não configurado (primeiro acesso), deixa entrar sinalizado
  // pra fazer o setup — o middleware trava qualquer outra tela do
  // admin até isso acontecer (ver /admin/mfa-setup).
  let mfaSetupRequired = false;
  if (role === "admin") {
    const admin = account as { mfa_secret: string | null; mfa_enabled: boolean; role: AdminRole };
    if (admin.mfa_enabled) {
      if (typeof totpCode !== "string" || totpCode.trim().length === 0 || !admin.mfa_secret) return null;
      // tolerância de 30s pra cada lado: sem isso, o código expira antes
      // de chegar no servidor (rede + tempo de digitar), e login legítimo
      // falharia quase sempre — o default da lib é 0 (janela exata).
      const result = await verifyTotp({ secret: admin.mfa_secret, token: totpCode.trim(), epochTolerance: 30 });
      if (!result.valid) return null;
    } else {
      mfaSetupRequired = true;
    }
  }

  let businessId: string | undefined;
  if (role === "business") businessId = account.id;
  if (role === "business_staff") businessId = (account as { business_id: string }).business_id;

  return {
    id: account.id,
    email: account.email,
    role,
    businessId,
    memberId: role === "member" ? account.id : undefined,
    adminRole: role === "admin" ? (account as { role: AdminRole }).role : undefined,
    isStaff: role === "business_staff",
    mfaSetupRequired,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        role: { label: "Role", type: "text" },
        totpCode: { label: "Código do autenticador", type: "text" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;
        // "role" enviado pelo formulário é a área de login (business/member/
        // admin) — o form não distingue owner de staff, os dois usam a
        // mesma tela em /login. Ver rolesToTry abaixo.
        const area = credentials?.role as "business" | "member" | "admin" | undefined;
        const totpCode = credentials?.totpCode;
        if (typeof email !== "string" || typeof password !== "string") return null;
        if (area !== "business" && area !== "member" && area !== "admin") return null;

        const supabase = createServiceClient();
        const identifier = `${area}:${email.toLowerCase()}`;
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

        const windowStart = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MS).toISOString();
        const { count: recentFailures } = await supabase
          .from("login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("identifier", identifier)
          .eq("success", false)
          .gte("created_at", windowStart);

        // Trancado: nem chega a checar a senha, e não grava mais uma linha
        // (evita inflar ainda mais a checagem durante um ataque em curso).
        if ((recentFailures ?? 0) >= MAX_LOGIN_ATTEMPTS) return null;

        const rolesToTry: Role[] = area === "business" ? ["business", "business_staff"] : [area];
        let user: AuthorizedUser | null = null;
        for (const role of rolesToTry) {
          user = await tryAuthenticate(supabase, email, password, role, totpCode);
          if (user) break;
        }
        await supabase.from("login_attempts").insert({ identifier, ip, success: Boolean(user) });
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role: Role; businessId?: string; memberId?: string; adminRole?: AdminRole; isStaff?: boolean; mfaSetupRequired?: boolean };
        token.role = u.role;
        token.businessId = u.businessId;
        token.memberId = u.memberId;
        token.adminRole = u.adminRole;
        token.isStaff = u.isStaff ?? false;
        token.mfaSetupRequired = u.mfaSetupRequired ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.businessId = token.businessId as string | undefined;
        session.user.memberId = token.memberId as string | undefined;
        session.user.adminRole = token.adminRole as AdminRole | undefined;
        session.user.isStaff = Boolean(token.isStaff);
        session.user.mfaSetupRequired = Boolean(token.mfaSetupRequired);
      }
      return session;
    },
  },
});
