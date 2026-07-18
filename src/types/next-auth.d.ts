import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      businessId: string;
    } & DefaultSession["user"];
  }

  interface User {
    businessId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    businessId: string;
  }
}
