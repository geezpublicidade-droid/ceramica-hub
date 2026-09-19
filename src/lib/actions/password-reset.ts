"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/services/email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Sempre retorna sucesso, mesmo se o e-mail não existir na base -- não
 * vaza quais e-mails estão cadastrados. O link só é enviado se a conta
 * existir de verdade. */
export async function requestPasswordReset(rawEmail: string): Promise<{ success: true }> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return { success: true };

  const supabase = createServiceClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();

  if (business) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    await supabase.from("password_reset_tokens").insert({
      business_id: business.id,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${siteUrl}/redefinir-senha?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Redefinir senha — Cerâmica Hub",
      html: `
        <p>Olá, ${business.name}.</p>
        <p>Recebemos um pedido pra redefinir a senha da sua conta no Cerâmica Hub.</p>
        <p><a href="${resetUrl}">Clique aqui pra criar uma nova senha</a></p>
        <p>Esse link expira em 1 hora. Se você não pediu isso, pode ignorar este e-mail.</p>
      `,
    });
  }

  return { success: true };
}

export type ResetPasswordResult = { success: true } | { success: false; error: string };

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<ResetPasswordResult> {
  if (newPassword.length < 8) {
    return { success: false, error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = createServiceClient();
  const tokenHash = hashToken(token);

  const { data: resetToken } = await supabase
    .from("password_reset_tokens")
    .select("id, business_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!resetToken || resetToken.used_at || new Date(resetToken.expires_at).getTime() < Date.now()) {
    return { success: false, error: "Esse link expirou ou já foi usado. Peça um novo." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("businesses")
    .update({ password_hash: passwordHash })
    .eq("id", resetToken.business_id);
  if (error) return { success: false, error: "Não foi possível redefinir a senha. Tente novamente." };

  await supabase
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetToken.id);

  return { success: true };
}
