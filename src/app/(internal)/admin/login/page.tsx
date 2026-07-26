import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — Painel administrativo" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; mfaConfigured?: string }>;
}) {
  const { error, callbackUrl, mfaConfigured } = await searchParams;

  return (
    <LoginForm
      role="admin"
      loginPath="/admin/login"
      defaultRedirect="/admin"
      callbackUrl={callbackUrl}
      error={error}
      title="Painel administrativo"
      subtitle={
        mfaConfigured
          ? "Verificação em duas etapas ativada — entre novamente com seu código."
          : "Acesso restrito à administração do Cerâmica Hub."
      }
      totpRequired={Boolean(mfaConfigured)}
    />
  );
}
