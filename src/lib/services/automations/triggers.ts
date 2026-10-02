import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { leadFollowupRule } from "@/lib/services/operations/rules";
import { runAutomations } from "./engine";

/** Avisa a equipe de lead novo (e-mail + tarefa de primeiro contato) na hora, sem esperar o cron diário. A trava de envio único torna seguro chamar a cada criação. */
export function triggerNewLeadNotification(): void {
  const run = () =>
    Promise.all([runAutomations("new_lead"), leadFollowupRule(createServiceClient())]).catch((error) =>
      console.error("[automations] novo lead:", error)
    );
  try {
    after(run);
  } catch {
    // Fora de uma requisição (script, teste) não há `after`; o cron diário cobre.
  }
}
