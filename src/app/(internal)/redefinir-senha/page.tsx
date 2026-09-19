import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Criar nova senha — Cerâmica Hub" };

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token} />;
}
