import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — Painel administrativo" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <LoginForm
      role="admin"
      loginPath="/admin/login"
      defaultRedirect="/admin"
      callbackUrl={callbackUrl}
      error={error}
      title="Painel administrativo"
      subtitle="Acesso restrito à administração do Cerâmica Hub."
    />
  );
}
