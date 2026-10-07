import type { DefaultSession } from "next-auth";

type Role = "business" | "business_staff" | "member" | "admin";
type AdminRole =
  | "super_admin"
  | "admin"
  | "financeiro"
  | "comercial"
  | "moderador"
  | "marketing"
  | "conteudo"
  | "atendimento"
  | "analista";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      businessId?: string;
      memberId?: string;
      adminRole?: AdminRole;
      isStaff?: boolean;
      mfaSetupRequired?: boolean;
      /** id do super_admin quando está dentro de uma empresa ("entrar como") */
      impersonatedBy?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    businessId?: string;
    memberId?: string;
    adminRole?: AdminRole;
    isStaff?: boolean;
    mfaSetupRequired?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    businessId?: string;
    memberId?: string;
    adminRole?: AdminRole;
    isStaff?: boolean;
    mfaSetupRequired?: boolean;
    impersonatedBy?: string;
  }
}
