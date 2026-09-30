"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import { createProduct, updateProduct, setProductActive, type ProductInput } from "@/lib/services/products";

type ActionResult = { success: true } | { success: false; error: string };

const PRODUCTS_PATH = "/admin/produtos";
const PRODUCT_ROLES: AdminRole[] = ["super_admin", "admin", "comercial", "financeiro"];

function validate(input: ProductInput): string | null {
  if (!input.name.trim()) return "Nome é obrigatório.";
  if (!/^[a-z0-9-]+$/.test(input.slug)) return "Slug deve ter só letras minúsculas, números e hífen.";
  const prices = [input.monthlyPriceCents, input.yearlyPriceCents];
  if (prices.some((p) => p !== null && (!Number.isInteger(p) || p < 0))) return "Preço inválido.";
  return null;
}

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  const adminId = await requireAdmin(PRODUCT_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };
  try {
    const id = await createProduct(input);
    await logAdminAction(adminId, "create_product", "product", id, { slug: input.slug });
  } catch {
    return { success: false, error: "Não foi possível salvar (o slug já existe?)." };
  }
  revalidatePath(PRODUCTS_PATH);
  return { success: true };
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult> {
  const adminId = await requireAdmin(PRODUCT_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };
  try {
    await updateProduct(id, input);
    await logAdminAction(adminId, "update_product", "product", id, { slug: input.slug });
  } catch {
    return { success: false, error: "Não foi possível salvar as alterações." };
  }
  revalidatePath(PRODUCTS_PATH);
  return { success: true };
}

export async function setProductActiveAction(id: string, active: boolean): Promise<ActionResult> {
  const adminId = await requireAdmin(PRODUCT_ROLES);
  try {
    await setProductActive(id, active);
    await logAdminAction(adminId, active ? "activate_product" : "deactivate_product", "product", id, {});
  } catch {
    return { success: false, error: "Não foi possível alterar o status." };
  }
  revalidatePath(PRODUCTS_PATH);
  return { success: true };
}
