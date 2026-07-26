import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verify as verifyTotp } from "otplib";
import { createServiceClient } from "@/lib/supabase/server";

type Role = "business" | "member" | "admin";

const TABLE_BY_ROLE: Record<Role, "businesses" | "members" | "admins"> = {
  business: "businesses",
  member: "members",
  admin: "admins",
};

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
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        const role = credentials?.role as Role | undefined;
        const totpCode = credentials?.totpCode;
        if (typeof email !== "string" || typeof password !== "string") return null;
        if (role !== "business" && role !== "member" && role !== "admin") return null;

        const supabase = createServiceClient();
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
          const admin = account as { mfa_secret: string | null; mfa_enabled: boolean };
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

        return {
          id: account.id,
          email: account.email,
          role,
          businessId: role === "business" ? account.id : undefined,
          memberId: role === "member" ? account.id : undefined,
          mfaSetupRequired,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role: Role; businessId?: string; memberId?: string; mfaSetupRequired?: boolean };
        token.role = u.role;
        token.businessId = u.businessId;
        token.memberId = u.memberId;
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
        session.user.mfaSetupRequired = Boolean(token.mfaSetupRequired);
      }
      return session;
    },
  },
});
