import type { DefaultSession } from "next-auth";

type Role = "business" | "member" | "admin";
type AdminRole = "super_admin" | "admin" | "financeiro" | "comercial" | "moderador";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      businessId?: string;
      memberId?: string;
      adminRole?: AdminRole;
      mfaSetupRequired?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    businessId?: string;
    memberId?: string;
    adminRole?: AdminRole;
    mfaSetupRequired?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    businessId?: string;
    memberId?: string;
    adminRole?: AdminRole;
    mfaSetupRequired?: boolean;
  }
}
