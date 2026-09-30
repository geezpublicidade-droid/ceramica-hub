"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  FINAL_STATUSES,
  PROPOSAL_STATUS_LABEL,
  addProposalEvent,
  createProposal,
  getProposalById,
  setProposalStatus,
  updateProposal,
  type ProposalInput,
  type ProposalStatus,
} from "@/lib/services/proposals";

type ActionResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; id: string } | { success: false; error: string };

const PROPOSALS_PATH = "/admin/propostas";
const PROPOSAL_ROLES: AdminRole[] = ["super_admin", "admin", "comercial"];

function validate(input: ProposalInput): string | null {
  if (!input.clientName.trim()) return "Nome do cliente é obrigatório.";
  if (input.items.length === 0) return "Adicione ao menos um item.";
  if (input.items.some((item) => !item.name.trim() || item.unitPriceCents < 0 || item.quantity < 1)) {
    return "Há item com nome, preço ou quantidade inválidos.";
  }
  if (input.discountPercent < 0 || input.discountPercent > 100 || input.discountCents < 0) return "Desconto inválido.";
  return null;
}

/** Mantém o funil do lead coerente com a proposta: enviada empurra o lead
 * pra "proposta enviada" (só se ainda estava antes disso); aceita fecha. */
async function syncLeadStage(leadId: string | null, status: ProposalStatus): Promise<void> {
  if (!leadId) return;
  const supabase = createServiceClient();
  if (status === "aceita") {
    await supabase.from("leads").update({ stage: "fechado" }).eq("id", leadId);
  } else if (status === "enviada") {
    await supabase
      .from("leads")
      .update({ stage: "proposta_enviada" })
      .eq("id", leadId)
      .in("stage", ["novo", "primeiro_contato", "qualificacao", "reuniao_agendada"]);
  }
}

export async function createProposalAction(input: ProposalInput): Promise<CreateResult> {
  const adminId = await requireAdmin(PROPOSAL_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };
  try {
    const id = await createProposal(input);
    await addProposalEvent(id, adminId, "created", "Proposta criada.");
    await logAdminAction(adminId, "create_proposal", "proposal", id, { clientName: input.clientName });
    revalidatePath(PROPOSALS_PATH);
    return { success: true, id };
  } catch {
    return { success: false, error: "Não foi possível criar a proposta." };
  }
}

export async function updateProposalAction(id: string, input: ProposalInput): Promise<ActionResult> {
  const adminId = await requireAdmin(PROPOSAL_ROLES);
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };
  const current = await getProposalById(id);
  if (!current) return { success: false, error: "Proposta não encontrada." };
  if (FINAL_STATUSES.includes(current.status)) return { success: false, error: "Proposta encerrada não pode ser editada." };
  try {
    await updateProposal(id, input);
    await addProposalEvent(id, adminId, "edited", "Itens, valores ou condições alterados.");
    await logAdminAction(adminId, "update_proposal", "proposal", id, {});
  } catch {
    return { success: false, error: "Não foi possível salvar as alterações." };
  }
  revalidatePath(PROPOSALS_PATH);
  revalidatePath(`${PROPOSALS_PATH}/${id}`);
  return { success: true };
}

export async function setProposalStatusAction(id: string, status: ProposalStatus, note?: string): Promise<ActionResult> {
  const adminId = await requireAdmin(PROPOSAL_ROLES);
  const current = await getProposalById(id);
  if (!current) return { success: false, error: "Proposta não encontrada." };
  if (FINAL_STATUSES.includes(current.status)) return { success: false, error: "Proposta já encerrada." };
  try {
    await setProposalStatus(id, status);
    await addProposalEvent(
      id,
      adminId,
      "status",
      `${PROPOSAL_STATUS_LABEL[current.status]} → ${PROPOSAL_STATUS_LABEL[status]}${note?.trim() ? ` — ${note.trim()}` : ""}`,
    );
    await syncLeadStage(current.leadId, status);
    await logAdminAction(adminId, "set_proposal_status", "proposal", id, { status });
  } catch {
    return { success: false, error: "Não foi possível alterar o status." };
  }
  revalidatePath(PROPOSALS_PATH);
  revalidatePath(`${PROPOSALS_PATH}/${id}`);
  revalidatePath("/admin/leads");
  return { success: true };
}
