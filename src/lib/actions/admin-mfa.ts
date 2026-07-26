"use server";

import { verify as verifyTotp } from "otplib";
import { auth, signOut } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";

type ConfirmResult = { success: true } | { success: false; error: string };

/**
 * Confirma o código digitado contra o segredo já gerado (ver getOrCreateMfaSecret)
 * e, se válido, ativa o MFA. Depois disso, força logout — o JWT atual ainda
 * carrega `mfaSetupRequired: true` (sessão JWT é stateless, não atualiza
 * sozinha), então o jeito simples de refletir a mudança é pedir login de
 * novo, agora já exigindo o código.
 */
export async function confirmMfaSetup(code: string): Promise<ConfirmResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Acesso restrito a administradores.");

  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from("admins")
    .select("mfa_secret, mfa_enabled")
    .eq("id", session.user.id)
    .single();

  if (!admin?.mfa_secret) return { success: false, error: "Configuração não iniciada. Recarregue a página." };
  if (admin.mfa_enabled) return { success: false, error: "MFA já está ativado." };

  const result = code.trim()
    ? await verifyTotp({ secret: admin.mfa_secret, token: code.trim(), epochTolerance: 30 })
    : { valid: false };
  if (!result.valid) {
    return { success: false, error: "Código inválido. Confira o app autenticador e tente de novo." };
  }

  const { error } = await supabase.from("admins").update({ mfa_enabled: true }).eq("id", session.user.id);
  if (error) return { success: false, error: "Não foi possível ativar o MFA. Tente novamente." };

  await signOut({ redirectTo: "/admin/login?mfaConfigured=1" });
  return { success: true };
}
