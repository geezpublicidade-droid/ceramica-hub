import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { LOGIN_PATH_BY_AREA, type LoginArea } from "@/lib/login-paths";

type Role = "business" | "business_staff" | "member" | "admin";
export type AdminRole = "super_admin" | "admin" | "financeiro" | "comercial" | "moderador";

const TABLE_BY_ROLE: Record<Role, "businesses" | "business_staff" | "members" | "admins"> = {
  business: "businesses",
  business_staff: "business_staff",
  member: "members",
  admin: "admins",
};

// Quais tabelas checar pra cada área de login — a mesma regra vale pro
// Credentials (authorize() abaixo) e pro Google (authenticateGoogleAccount).
function rolesForArea(area: LoginArea): Role[] {
  return area === "business" ? ["business", "business_staff"] : [area];
}

// Área de login que o Google não sabe informar sozinho (o provider só devolve
// e-mail/nome) — carregada num cookie de curta duração entre o clique em
// "Continuar com Google" e a volta do OAuth, ver signInWithGoogleAction().
export type GoogleLoginArea = LoginArea;
export const GOOGLE_AREA_COOKIE = "oauth-area";

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

type AccountRow = {
  id: string;
  email: string;
  password_hash: string | null;
  business_id?: string;
  role?: AdminRole;
};

async function fetchAccount(
  supabase: ReturnType<typeof createServiceClient>,
  role: Role,
  email: string
): Promise<AccountRow | null> {
  const { data: account } = await supabase
    .from(TABLE_BY_ROLE[role])
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return account as AccountRow | null;
}

function toAuthorizedUser(account: AccountRow, role: Role): AuthorizedUser {
  let businessId: string | undefined;
  if (role === "business") businessId = account.id;
  if (role === "business_staff") businessId = account.business_id;

  return {
    id: account.id,
    email: account.email,
    role,
    businessId,
    memberId: role === "member" ? account.id : undefined,
    adminRole: role === "admin" ? account.role : undefined,
    isStaff: role === "business_staff",
    // MFA removido: não é mais exigido no login de admin, mesmo pra contas
    // que tinham mfa_enabled=true de antes.
    mfaSetupRequired: false,
  };
}

async function tryAuthenticate(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  password: string,
  role: Role
): Promise<AuthorizedUser | null> {
  const account = await fetchAccount(supabase, role, email);
  if (!account || !account.password_hash) return null;

  const valid = await bcrypt.compare(password, account.password_hash);
  if (!valid) return null;

  return toAuthorizedUser(account, role);
}

/**
 * Login via Google não tem senha pra checar — a garantia de identidade é o
 * e-mail verificado que o próprio Google devolve. Empresa e admin só entram
 * assim se já existir uma conta com esse e-mail (criada pelo fluxo normal:
 * /cadastro com comprovante, ou seed manual de admin) — Google nunca cria
 * conta de empresa/admin sozinho. Membro é o oposto: não existe outro jeito
 * de virar membro, então a primeira vez que alguém entra com esse e-mail já
 * cria a linha em `members`.
 */
async function authenticateGoogleAccount(
  supabase: ReturnType<typeof createServiceClient>,
  area: GoogleLoginArea,
  email: string,
  name: string | null | undefined
): Promise<AuthorizedUser | null> {
  if (area === "member") {
    const existing = await fetchAccount(supabase, "member", email);
    if (existing) return toAuthorizedUser(existing, "member");

    const { data: created } = await supabase
      .from("members")
      .insert({ email: email.toLowerCase(), name: name?.trim() || email, password_hash: null })
      .select("*")
      .single();
    return created ? toAuthorizedUser(created as AccountRow, "member") : null;
  }

  const roles = rolesForArea(area);
  const accounts = await Promise.all(roles.map((role) => fetchAccount(supabase, role, email)));
  const foundIndex = accounts.findIndex((account) => account !== null);
  return foundIndex === -1 ? null : toAuthorizedUser(accounts[foundIndex]!, roles[foundIndex]);
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
      },
      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;
        // "role" enviado pelo formulário é a área de login (business/member/
        // admin) — o form não distingue owner de staff, os dois usam a
        // mesma tela em /login. Ver rolesToTry abaixo.
        const area = credentials?.role as "business" | "member" | "admin" | undefined;
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

        let user: AuthorizedUser | null = null;
        for (const role of rolesForArea(area)) {
          user = await tryAuthenticate(supabase, email, password, role);
          if (user) break;
        }
        await supabase.from("login_attempts").insert({ identifier, ip, success: Boolean(user) });
        return user;
      },
    }),
    Google,
  ],
  callbacks: {
    // Só entra aqui pro provider "google" (credentials já resolve tudo em
    // authorize() acima). A área (business/member/admin) veio num cookie
    // setado por signInWithGoogleAction() antes do redirect pro Google —
    // é a única forma de saber em qual tela a pessoa clicou "Continuar com
    // Google", já que o provider em si não carrega esse contexto.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = profile?.email?.toLowerCase();
      if (!email || profile?.email_verified !== true) return false;

      const cookieStore = await cookies();
      const area = cookieStore.get(GOOGLE_AREA_COOKIE)?.value as GoogleLoginArea | undefined;
      cookieStore.delete(GOOGLE_AREA_COOKIE);
      if (!area) return false;

      const supabase = createServiceClient();
      const authorized = await authenticateGoogleAccount(supabase, area, email, profile?.name);
      if (!authorized) return `${LOGIN_PATH_BY_AREA[area]}?error=google_not_found`;

      Object.assign(user, authorized);
      return true;
    },
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
