import { createServiceClient } from "@/lib/supabase/server";

export type SupportTicketStatus = "aberto" | "respondido" | "fechado";
export type SupportRequesterType = "business" | "member";

export type SupportMessage = {
  id: string;
  senderType: "requester" | "admin";
  senderName: string;
  body: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  requesterType: SupportRequesterType;
  requesterName: string;
  requesterContact: string;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketWithMessages = SupportTicket & { messages: SupportMessage[] };

/** Quem está abrindo/vendo o chamado -- deriva sempre da sessão (nunca de
 * parâmetro vindo do cliente), mesmo raciocínio de isolamento por tenant
 * documentado em auth-guards.ts. */
export type RequesterIdentity = { type: "business"; id: string } | { type: "member"; id: string };

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: row.id as string,
    requesterType: row.requester_type as SupportRequesterType,
    requesterName: row.requester_name as string,
    requesterContact: row.requester_contact as string,
    subject: row.subject as string,
    status: row.status as SupportTicketStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: row.id as string,
    senderType: row.sender_type as SupportMessage["senderType"],
    senderName: row.sender_name as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

async function getMessages(ticketId: string): Promise<SupportMessage[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function listOwnedTickets(requester: RequesterIdentity): Promise<SupportTicket[]> {
  const supabase = createServiceClient();
  const column = requester.type === "business" ? "business_id" : "member_id";
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq(column, requester.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTicket);
}

/** Filtra por dono na própria query -- é o mecanismo real de isolamento
 * (IDOR): um empresário/membro só recupera o ticket se o id bater com o da
 * própria sessão, nunca um id arbitrário vindo do cliente. */
export async function getOwnedTicket(
  ticketId: string,
  requester: RequesterIdentity
): Promise<SupportTicketWithMessages | null> {
  const supabase = createServiceClient();
  const column = requester.type === "business" ? "business_id" : "member_id";
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq(column, requester.id)
    .maybeSingle();
  if (error) throw error;
  if (!ticket) return null;
  const messages = await getMessages(ticketId);
  return { ...mapTicket(ticket), messages };
}

export async function createTicket(input: {
  requester: RequesterIdentity;
  requesterName: string;
  requesterContact: string;
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const supabase = createServiceClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      requester_type: input.requester.type,
      business_id: input.requester.type === "business" ? input.requester.id : null,
      member_id: input.requester.type === "member" ? input.requester.id : null,
      requester_name: input.requesterName,
      requester_contact: input.requesterContact,
      subject: input.subject,
    })
    .select("*")
    .single();
  if (error || !ticket) throw error ?? new Error("Não foi possível criar o chamado.");

  await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender_type: "requester",
    sender_name: input.requesterName,
    body: input.message,
  });

  return mapTicket(ticket);
}

/** Reabre o ticket quando quem abriu responde de novo -- um chamado
 * "respondido"/"fechado" que recebe mensagem nova do lado de fora precisa
 * voltar a aparecer como pendente pro admin. `sender_name` reaproveita o
 * nome já salvo no ticket (não recebe de novo do cliente a cada mensagem). */
export async function addRequesterMessage(
  ticketId: string,
  requester: RequesterIdentity,
  body: string
): Promise<boolean> {
  const owned = await getOwnedTicket(ticketId, requester);
  if (!owned) return false;

  const supabase = createServiceClient();
  await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_type: "requester",
    sender_name: owned.requesterName,
    body,
  });
  await supabase.from("support_tickets").update({ status: "aberto" }).eq("id", ticketId);
  return true;
}

export async function listAllTicketsForAdmin(statusFilter?: SupportTicketStatus): Promise<SupportTicket[]> {
  const supabase = createServiceClient();
  let query = supabase.from("support_tickets").select("*");
  if (statusFilter) query = query.eq("status", statusFilter);
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTicket);
}

export async function getTicketForAdmin(ticketId: string): Promise<SupportTicketWithMessages | null> {
  const supabase = createServiceClient();
  const { data: ticket, error } = await supabase.from("support_tickets").select("*").eq("id", ticketId).maybeSingle();
  if (error) throw error;
  if (!ticket) return null;
  const messages = await getMessages(ticketId);
  return { ...mapTicket(ticket), messages };
}

export async function addAdminMessage(ticketId: string, adminName: string, body: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_type: "admin",
    sender_name: adminName,
    body,
  });
  await supabase.from("support_tickets").update({ status: "respondido" }).eq("id", ticketId);
}

export async function updateTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
}

export async function countOpenTicketsForAdmin(): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .neq("status", "fechado");
  if (error) throw error;
  return count ?? 0;
}
