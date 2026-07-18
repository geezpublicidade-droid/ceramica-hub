import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — Cerâmica Hub" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <LoginForm
      role="business"
      loginPath="/login"
      defaultRedirect="/dashboard"
      callbackUrl={callbackUrl}
      error={error}
      title="Entrar"
      subtitle="Acesse o painel da sua empresa."
    />
  );
}
