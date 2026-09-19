import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — Cerâmica Hub" };

export default async function MemberLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <LoginForm
      role="member"
      loginPath="/membro/login"
      defaultRedirect="/membro"
      callbackUrl={callbackUrl}
      error={error}
      title="Entrar"
      subtitle="Favorite empresas do Cerâmica Hub com sua conta do Google."
      googleOnly
    />
  );
}
