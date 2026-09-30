import { after } from "next/server";
import { runAutomations } from "./engine";

/** Avisa a equipe de lead novo na hora, sem esperar o cron diário. A trava de envio único torna seguro chamar a cada criação. */
export function triggerNewLeadNotification(): void {
  const run = () =>
    runAutomations("new_lead").catch((error) => console.error("[automations] novo lead:", error));
  try {
    after(run);
  } catch {
    // Fora de uma requisição (script, teste) não há `after`; o cron diário cobre.
  }
}
