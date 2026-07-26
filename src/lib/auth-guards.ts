import { auth } from "@/auth";

export async function requireOwnBusiness(): Promise<string> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) throw new Error("Não autenticado.");
  return businessId;
}

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
  return session.user.id;
}
