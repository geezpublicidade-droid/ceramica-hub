"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import { PAYMENT_STATUSES, PLACEMENT_STATUSES, type PaymentStatus, type PlacementStatus } from "@/lib/placement-rules";
import {
  PlacementError,
  createPlacement,
  renewPlacement,
  updatePlacement,
  type PlacementInput,
  type PlacementPatch,
} from "@/lib/services/category-placements-admin";
import { linkBusinessCategories } from "@/lib/services/business-categories";

type ActionResult = { success: true; id?: string } | { success: false; error: string };

const PAGE = "/admin/publicidade/categorias";
const SALES_ROLES: AdminRole[] = ["super_admin", "admin", "comercial", "marketing"];
const PAYMENT_ROLES: AdminRole[] = ["super_admin", "admin", "financeiro", "comercial"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateInput(input: PlacementInput): string | null {
  if (!input.businessId || !input.categoryId || !input.placementTypeId) return "Escolha empresa, categoria e tipo de posição.";
  if (!DATE_PATTERN.test(input.startsAt) || !DATE_PATTERN.test(input.endsAt)) return "Período inválido.";
  if (input.endsAt < input.startsAt) return "O término não pode ser antes do início.";
  if (input.amountCents !== null && (!Number.isInteger(input.amountCents) || input.amountCents < 0)) return "Valor inválido.";
  if (!Number.isInteger(input.rotationWeight) || input.rotationWeight < 1 || input.rotationWeight > 10) {
    return "O peso de rotação deve ficar entre 1 e 10.";
  }
  if (!PAYMENT_STATUSES.includes(input.paymentStatus)) return "Status de pagamento inválido.";
  return null;
}

/** Erros de regra de negócio viram mensagem para o admin; o resto sobe como erro real. */
async function run(task: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof PlacementError) return { success: false, error: error.message };
    throw error;
  }
}

export async function createCategoryPlacementAction(input: PlacementInput): Promise<ActionResult> {
  const adminId = await requireAdmin(SALES_ROLES);
  const invalid = validateInput(input);
  if (invalid) return { success: false, error: invalid };
  return run(async () => {
    const id = await createPlacement(input);
    await logAdminAction(adminId, "create_category_placement", "category_placement", id, {
      businessId: input.businessId,
      categoryId: input.categoryId,
    });
    revalidatePath(PAGE);
    return { success: true, id };
  });
}

async function patchPlacement(id: string, patch: PlacementPatch, action: string, roles: AdminRole[]): Promise<ActionResult> {
  const adminId = await requireAdmin(roles);
  return run(async () => {
    await updatePlacement(id, patch);
    await logAdminAction(adminId, action, "category_placement", id, patch);
    revalidatePath(PAGE);
    return { success: true };
  });
}

export async function setPlacementStatusAction(id: string, status: PlacementStatus): Promise<ActionResult> {
  if (!PLACEMENT_STATUSES.includes(status)) return { success: false, error: "Status inválido." };
  return patchPlacement(id, { status }, `set_category_placement_${status}`, SALES_ROLES);
}

export async function setPlacementPaymentAction(id: string, paymentStatus: PaymentStatus): Promise<ActionResult> {
  if (!PAYMENT_STATUSES.includes(paymentStatus)) return { success: false, error: "Pagamento inválido." };
  return patchPlacement(id, { paymentStatus }, "set_category_placement_payment", PAYMENT_ROLES);
}

export async function reorderPlacementAction(id: string, position: number, rotationWeight: number): Promise<ActionResult> {
  if (!Number.isInteger(position) || position < 0 || !Number.isInteger(rotationWeight) || rotationWeight < 1 || rotationWeight > 10) {
    return { success: false, error: "Posição ou peso inválido." };
  }
  return patchPlacement(id, { position, rotationWeight }, "reorder_category_placement", SALES_ROLES);
}

export async function renewPlacementAction(id: string, months: number): Promise<ActionResult> {
  const adminId = await requireAdmin(SALES_ROLES);
  if (!Number.isInteger(months) || months < 1 || months > 24) return { success: false, error: "Renovação inválida." };
  return run(async () => {
    await renewPlacement(id, months);
    await logAdminAction(adminId, "renew_category_placement", "category_placement", id, { months });
    revalidatePath(PAGE);
    return { success: true };
  });
}

/** Define as categorias de atuação da empresa (primária + extras); usado no painel da empresa 360°. */
export async function setBusinessCategoriesAction(businessId: string, input: { categoryIds: string[] }): Promise<ActionResult> {
  const { categoryIds } = input;
  const adminId = await requireAdmin(SALES_ROLES);
  await linkBusinessCategories(businessId, categoryIds);
  await logAdminAction(adminId, "set_business_categories", "business", businessId, { categoryIds });
  revalidatePath(`/admin/empresas/${businessId}`);
  revalidatePath(PAGE);
  return { success: true };
}
