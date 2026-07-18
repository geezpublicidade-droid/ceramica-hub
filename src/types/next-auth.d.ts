import type { DefaultSession } from "next-auth";

type Role = "business" | "member" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      businessId?: string;
      memberId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    businessId?: string;
    memberId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    businessId?: string;
    memberId?: string;
  }
}
