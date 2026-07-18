import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        const role = credentials?.role as Role | undefined;
        if (typeof email !== "string" || typeof password !== "string") return null;
        if (role !== "business" && role !== "member" && role !== "admin") return null;

        const supabase = createServiceClient();
        const { data: account } = await supabase
          .from(TABLE_BY_ROLE[role])
          .select("id, email, password_hash")
          .eq("email", email.toLowerCase())
          .maybeSingle();
        if (!account) return null;

        const valid = await bcrypt.compare(password, account.password_hash);
        if (!valid) return null;

        return {
          id: account.id,
          email: account.email,
          role,
          businessId: role === "business" ? account.id : undefined,
          memberId: role === "member" ? account.id : undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role: Role; businessId?: string; memberId?: string };
        token.role = u.role;
        token.businessId = u.businessId;
        token.memberId = u.memberId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.businessId = token.businessId as string | undefined;
        session.user.memberId = token.memberId as string | undefined;
      }
      return session;
    },
  },
});
