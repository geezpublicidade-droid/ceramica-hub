"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireBusinessOwner } from "@/lib/auth-guards";

type ActionResult = { success: true } | { success: false; error: string };

const inviteStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Senha precisa ter no mínimo 8 caracteres."),
  name: z.string().trim().min(2, "Informe o nome."),
});

export async function listStaff(): Promise<{ id: string; email: string; name: string }[]> {
  const businessId = await requireBusinessOwner();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("business_staff")
    .select("id, email, name")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * Só o owner convida — staff nunca pode criar outro staff (evita escalar
 * a própria equipe sem o dono saber). E-mail precisa ser único também
 * contra a tabela `businesses`: como o /login tenta as duas tabelas pra
 * resolver a mesma tela, um e-mail em comum nas duas seria ambíguo.
 */
export async function inviteStaff(rawInput: z.infer<typeof inviteStaffSchema>): Promise<ActionResult> {
  const businessId = await requireBusinessOwner();
  const parsed = inviteStaffSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const [{ data: existingBusiness }, { data: existingStaff }] = await Promise.all([
    supabase.from("businesses").select("id").eq("email", parsed.data.email).maybeSingle(),
    supabase.from("business_staff").select("id").eq("email", parsed.data.email).maybeSingle(),
  ]);
  if (existingBusiness || existingStaff) return { success: false, error: "Já existe uma conta com esse e-mail." };

  const password_hash = await bcrypt.hash(parsed.data.password, 12);
  const { error } = await supabase.from("business_staff").insert({
    business_id: businessId,
    email: parsed.data.email,
    password_hash,
    name: parsed.data.name,
  });
  if (error) return { success: false, error: "Não foi possível cadastrar o membro da equipe." };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeStaff(staffId: string): Promise<ActionResult> {
  const businessId = await requireBusinessOwner();
  const supabase = createServiceClient();

  // Filtra por business_id junto do id do recurso -- sem isso, um owner
  // poderia remover staff de outra empresa adivinhando o UUID (IDOR).
  const { error } = await supabase.from("business_staff").delete().eq("id", staffId).eq("business_id", businessId);
  if (error) return { success: false, error: "Não foi possível remover o membro da equipe." };

  revalidatePath("/dashboard");
  return { success: true };
}
