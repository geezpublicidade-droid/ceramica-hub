"use server";

import { revalidatePath } from "next/cache";
import { requireOwnBusiness } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/services/platform";
import { linkBusinessCategories } from "@/lib/services/business-categories";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * A própria empresa escolhe subcategorias/especialidades em que atua e como atende.
 * Só níveis 2 e 3: a categoria principal continua sendo a do cadastro (alterá-la passa pelo suporte).
 */
export async function updateOwnCategorizationAction(input: {
  categoryIds: string[];
  inPerson?: boolean;
  online?: boolean;
}): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const { data: allowed, error } = input.categoryIds.length
    ? await supabase.from("categories").select("id").in("id", input.categoryIds).gte("level", 2)
    : { data: [], error: null };
  if (error) throw error;

  await linkBusinessCategories(businessId, (allowed ?? []).map((row) => row.id as string));

  if (typeof input.inPerson === "boolean" && typeof input.online === "boolean") {
    if (!input.inPerson && !input.online) return { success: false, error: "Marque pelo menos uma forma de atendimento." };
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ serves_in_person: input.inPerson, serves_online: input.online })
      .eq("id", businessId);
    if (updateError) throw updateError;
  }

  revalidatePath("/dashboard/editar");
  revalidatePath(`/empresa/${business.slug}`);
  revalidatePath("/empresas");
  return { success: true };
}
