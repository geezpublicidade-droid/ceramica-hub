"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

const ANCHOR_ROLES = ["super_admin", "admin", "comercial"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = z.string().trim().url("URL inválida.").optional().or(z.literal(""));
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

function revalidateAnchor(partnerId: string) {
  revalidatePath(`/admin/parceiros/${partnerId}`);
  revalidatePath("/parceiros");
}

/** Insere/atualiza e devolve ActionResult padronizado, pra cada action abaixo não repetir o tratamento de erro. */
async function runWrite(
  adminId: string,
  auditAction: string,
  entityType: string,
  entityId: string,
  partnerId: string,
  write: () => PromiseLike<{ error: unknown }>,
  failureMessage: string
): Promise<ActionResult> {
  const { error } = await write();
  if (error) return { success: false, error: failureMessage };
  await logAdminAction(adminId, auditAction, entityType, entityId, { partnerId });
  revalidateAnchor(partnerId);
  return { success: true };
}

// ---- Página da âncora -------------------------------------------------

const pageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen no endereço da página.")
    .optional()
    .or(z.literal("")),
  description: optionalText(1000),
  coverUrl: optionalUrl,
  hasPage: z.boolean(),
});

export async function updateAnchorPage(partnerId: string, rawInput: z.input<typeof pageSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const parsed = pageSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  if (parsed.data.hasPage && !parsed.data.slug) return { success: false, error: "Defina o endereço da página (slug)." };

  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "update_anchor_page",
    "institutional_partner",
    partnerId,
    partnerId,
    () =>
      supabase
        .from("institutional_partners")
        .update({
          slug: parsed.data.slug || null,
          description: parsed.data.description || null,
          cover_url: parsed.data.coverUrl || null,
          has_page: parsed.data.hasPage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", partnerId),
    "Não foi possível salvar a página (o endereço pode já estar em uso)."
  );
}

// ---- Contratos e entregas --------------------------------------------

const contractSchema = z
  .object({
    startsOn: dateField,
    endsOn: dateField,
    valueReais: z.number().min(0).optional(),
    notes: optionalText(1000),
  })
  .refine((v) => v.endsOn >= v.startsOn, { message: "O fim do contrato não pode ser antes do início." });

export async function createAnchorContract(partnerId: string, rawInput: z.input<typeof contractSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const parsed = contractSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "create_anchor_contract",
    "anchor_contract",
    partnerId,
    partnerId,
    () =>
      supabase.from("anchor_contracts").insert({
        partner_id: partnerId,
        starts_on: parsed.data.startsOn,
        ends_on: parsed.data.endsOn,
        value_cents: parsed.data.valueReais != null ? Math.round(parsed.data.valueReais * 100) : null,
        notes: parsed.data.notes || null,
      }),
    "Não foi possível criar o contrato."
  );
}

export async function updateContractStatus(partnerId: string, contractId: string, status: "ativo" | "encerrado" | "cancelado"): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "update_anchor_contract_status",
    "anchor_contract",
    contractId,
    partnerId,
    () => supabase.from("anchor_contracts").update({ status }).eq("id", contractId).eq("partner_id", partnerId),
    "Não foi possível atualizar o contrato."
  );
}

const deliverableSchema = z.object({
  title: z.string().trim().min(1, "Informe o que será entregue.").max(200),
  dueOn: dateField.optional().or(z.literal("")),
});

export async function addDeliverable(partnerId: string, contractId: string, rawInput: z.input<typeof deliverableSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const parsed = deliverableSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  // Garante que o contrato é mesmo deste parceiro antes de pendurar a entrega nele.
  const { data: contract } = await supabase.from("anchor_contracts").select("id").eq("id", contractId).eq("partner_id", partnerId).maybeSingle();
  if (!contract) return { success: false, error: "Contrato não encontrado." };

  return runWrite(
    adminId,
    "add_anchor_deliverable",
    "anchor_contract",
    contractId,
    partnerId,
    () => supabase.from("anchor_deliverables").insert({ contract_id: contractId, title: parsed.data.title, due_on: parsed.data.dueOn || null }),
    "Não foi possível adicionar a entrega."
  );
}

const deliveryUpdateSchema = z.object({
  status: z.enum(["pendente", "realizada", "cancelada"]),
  evidenceUrl: optionalUrl,
});

export async function updateDeliverable(partnerId: string, deliverableId: string, rawInput: z.input<typeof deliveryUpdateSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const parsed = deliveryUpdateSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "update_anchor_deliverable",
    "anchor_deliverable",
    deliverableId,
    partnerId,
    () =>
      supabase
        .from("anchor_deliverables")
        .update({
          status: parsed.data.status,
          delivered_on: parsed.data.status === "realizada" ? new Date().toISOString().slice(0, 10) : null,
          evidence_url: parsed.data.evidenceUrl || null,
        })
        .eq("id", deliverableId),
    "Não foi possível atualizar a entrega."
  );
}

export async function deleteDeliverable(partnerId: string, deliverableId: string): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "delete_anchor_deliverable",
    "anchor_deliverable",
    deliverableId,
    partnerId,
    () => supabase.from("anchor_deliverables").delete().eq("id", deliverableId),
    "Não foi possível excluir a entrega."
  );
}

// ---- Lojas ------------------------------------------------------------

const storeSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da loja.").max(120),
  segment: optionalText(80),
  floor: optionalText(60),
  description: optionalText(400),
  instagram: optionalText(80),
  website: optionalUrl,
});

export async function addAnchorStore(partnerId: string, rawInput: z.input<typeof storeSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const parsed = storeSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "add_anchor_store",
    "institutional_partner",
    partnerId,
    partnerId,
    () =>
      supabase.from("anchor_stores").insert({
        partner_id: partnerId,
        name: parsed.data.name,
        segment: parsed.data.segment || null,
        floor: parsed.data.floor || null,
        description: parsed.data.description || null,
        instagram: parsed.data.instagram || null,
        website: parsed.data.website || null,
      }),
    "Não foi possível adicionar a loja."
  );
}

export async function setStoreActive(partnerId: string, storeId: string, active: boolean): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "set_anchor_store_active",
    "anchor_store",
    storeId,
    partnerId,
    () => supabase.from("anchor_stores").update({ active }).eq("id", storeId).eq("partner_id", partnerId),
    "Não foi possível atualizar a loja."
  );
}

export async function deleteAnchorStore(partnerId: string, storeId: string): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const supabase = createServiceClient();
  return runWrite(
    adminId,
    "delete_anchor_store",
    "anchor_store",
    storeId,
    partnerId,
    () => supabase.from("anchor_stores").delete().eq("id", storeId).eq("partner_id", partnerId),
    "Não foi possível excluir a loja."
  );
}

const highlightSchema = z.object({
  paidUntil: dateField,
  valueReais: z.number().positive("O destaque é pago: informe o valor recebido."),
});

/** Regra de destaque pago: só liga com valor > 0 e vigência; sem isso a loja aparece em ordem normal, sem selo. */
export async function setStoreHighlight(partnerId: string, storeId: string, rawInput: z.input<typeof highlightSchema> | null): Promise<ActionResult> {
  const adminId = await requireAdmin([...ANCHOR_ROLES]);
  const supabase = createServiceClient();

  if (rawInput === null) {
    return runWrite(
      adminId,
      "clear_anchor_store_highlight",
      "anchor_store",
      storeId,
      partnerId,
      () => supabase.from("anchor_stores").update({ highlight_paid_until: null, highlight_value_cents: null }).eq("id", storeId).eq("partner_id", partnerId),
      "Não foi possível remover o destaque."
    );
  }

  const parsed = highlightSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  return runWrite(
    adminId,
    "set_anchor_store_highlight",
    "anchor_store",
    storeId,
    partnerId,
    () =>
      supabase
        .from("anchor_stores")
        .update({ highlight_paid_until: parsed.data.paidUntil, highlight_value_cents: Math.round(parsed.data.valueReais * 100) })
        .eq("id", storeId)
        .eq("partner_id", partnerId),
    "Não foi possível salvar o destaque."
  );
}
