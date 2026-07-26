import { redirect } from "next/navigation";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { MfaSetupForm } from "@/components/admin/MfaSetupForm";

export const metadata = { title: "Configurar MFA — Cerâmica Hub" };

async function getOrCreateMfaSecret(adminId: string, email: string): Promise<{ secret: string; enabled: boolean }> {
  const supabase = createServiceClient();
  const { data: admin } = await supabase.from("admins").select("mfa_secret, mfa_enabled").eq("id", adminId).single();

  if (admin?.mfa_enabled) return { secret: "", enabled: true };
  if (admin?.mfa_secret) return { secret: admin.mfa_secret, enabled: false };

  const secret = generateSecret();
  await supabase.from("admins").update({ mfa_secret: secret }).eq("id", adminId);
  void email;
  return { secret, enabled: false };
}

export default async function AdminMfaSetupPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin/login");

  const { secret, enabled } = await getOrCreateMfaSecret(session.user.id, session.user.email ?? "");
  if (enabled) redirect("/admin");

  const otpauthUrl = generateURI({ issuer: "Cerâmica Hub", label: session.user.email ?? "admin", secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div className="glass-light w-full max-w-sm rounded-3xl p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Configure a verificação em duas etapas</h1>
        <p className="mt-2 text-[13px] text-muted">
          Obrigatório pra contas de administrador. Escaneie o código com o Google Authenticator, Authy
          ou outro app compatível.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCodeDataUrl} alt="QR code de configuração do MFA" className="mx-auto mt-6 h-48 w-48 rounded-xl" />

        <p className="mt-4 break-all text-[12px] text-muted">
          Não conseguiu escanear? Digite manualmente: <span className="font-mono text-foreground">{secret}</span>
        </p>

        <MfaSetupForm />
      </div>
    </main>
  );
}
