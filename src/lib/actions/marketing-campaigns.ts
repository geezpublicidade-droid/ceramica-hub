"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  addCampaignCreative,
  createMarketingCampaign,
  deleteCampaignCreative,
  deleteMarketingCampaign,
  setMarketingCampaignStatus,
  updateManualResults,
  updateMarketingCampaign,
  CAMPAIGN_STATE_ORDER,
  type CampaignCreative,
  type CampaignState,
  type MarketingCampaignInput,
} from "@/lib/services/marketing-campaigns";
import { setLink, LINK_KIND_LABEL, type LinkKind } from "@/lib/services/marketing-campaign-links";

type ActionResult = { success: true; id?: string } | { success: false; error: string };

const LIST_PATH = "/admin/marketing/campanhas";
const MARKETING_ROLES: AdminRole[] = ["super_admin", "admin", "marketing"];
// Aprovar, ativar, encerrar e excluir é decisão de gestão.
const MANAGER_ROLES: AdminRole[] = ["super_admin", "admin", "marketing"];
const MANAGER_STATES: CampaignState[] = ["aprovada", "ativa", "encerrada", "cancelada"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validate(input: MarketingCampaignInput): string | null {
  if (!input.name.trim()) return "Nome é obrigatório.";
  if (!DATE_PATTERN.test(input.startsOn) || !DATE_PATTERN.test(input.endsOn)) return "Período inválido.";
  if (input.endsOn < input.startsOn) return "O término não pode ser antes do início.";
  if (input.budgetCents !== null && (!Number.isInteger(input.budgetCents) || input.budgetCents < 0)) {
    return "Orçamento inválido.";
  }
  return null;
}

function revalidateCampaign(id?: string) {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin/marketing");
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

export async function createMarketingCampaignAction(input: MarketingCampaignInput): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  const id = await createMarketingCampaign(input, adminId);
  await logAdminAction(adminId, "create_marketing_campaign", "marketing_campaign", id, { name: input.name });
  revalidateCampaign();
  return { success: true, id };
}

export async function updateMarketingCampaignAction(id: string, input: MarketingCampaignInput): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  await updateMarketingCampaign(id, input);
  await logAdminAction(adminId, "update_marketing_campaign", "marketing_campaign", id, { name: input.name });
  revalidateCampaign(id);
  return { success: true };
}

export async function setMarketingCampaignStatusAction(id: string, status: CampaignState): Promise<ActionResult> {
  if (!CAMPAIGN_STATE_ORDER.includes(status)) return { success: false, error: "Status inválido." };
  const adminId = await requireAdmin(MANAGER_STATES.includes(status) ? MANAGER_ROLES : MARKETING_ROLES);

  await setMarketingCampaignStatus(id, status, adminId);
  await logAdminAction(adminId, "set_marketing_campaign_status", "marketing_campaign", id, { status });
  revalidateCampaign(id);
  return { success: true };
}

export async function deleteMarketingCampaignAction(id: string): Promise<ActionResult> {
  const adminId = await requireAdmin(MANAGER_ROLES);
  await deleteMarketingCampaign(id);
  await logAdminAction(adminId, "delete_marketing_campaign", "marketing_campaign", id, {});
  revalidateCampaign();
  return { success: true };
}

export async function addCampaignCreativeAction(
  campaignId: string,
  creative: Omit<CampaignCreative, "id">,
): Promise<ActionResult> {
  await requireAdmin(MARKETING_ROLES);
  if (!creative.title.trim()) return { success: false, error: "Título da peça é obrigatório." };
  if (creative.assetUrl && !/^https?:\/\//i.test(creative.assetUrl)) {
    return { success: false, error: "O link da peça precisa começar com http:// ou https://." };
  }

  await addCampaignCreative(campaignId, creative);
  revalidateCampaign(campaignId);
  return { success: true };
}

export async function deleteCampaignCreativeAction(campaignId: string, creativeId: string): Promise<ActionResult> {
  await requireAdmin(MARKETING_ROLES);
  await deleteCampaignCreative(creativeId);
  revalidateCampaign(campaignId);
  return { success: true };
}

export async function saveManualResultsAction(
  campaignId: string,
  results: { views: number; clicks: number; notes: string | null },
): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  const valid = [results.views, results.clicks].every((n) => Number.isInteger(n) && n >= 0);
  if (!valid) return { success: false, error: "Use números inteiros, zero ou maiores." };

  await updateManualResults(campaignId, results);
  await logAdminAction(adminId, "update_marketing_results", "marketing_campaign", campaignId, {});
  revalidateCampaign(campaignId);
  return { success: true };
}

export async function linkToCampaignAction(
  kind: LinkKind,
  entityId: string,
  campaignId: string | null,
): Promise<ActionResult> {
  const adminId = await requireAdmin(MARKETING_ROLES);
  if (!(kind in LINK_KIND_LABEL)) return { success: false, error: "Tipo inválido." };

  await setLink(kind, entityId, campaignId);
  await logAdminAction(adminId, campaignId ? "link_to_marketing_campaign" : "unlink_from_marketing_campaign", kind, entityId, {
    campaignId,
  });
  revalidateCampaign(campaignId ?? undefined);
  return { success: true };
}
