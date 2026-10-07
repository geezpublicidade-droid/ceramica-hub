import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { clientIpFrom, rateLimitKey } from "@/lib/rate-limit-key";
import { isFeatureEnabled } from "@/lib/services/feature-flags";

export type RateLimitRule = { scope: string; max: number; windowSeconds: number };

/** Regras dos endpoints públicos (por IP). */
export const RATE_LIMITS = {
  search: { scope: "search", max: 40, windowSeconds: 60 },
  smartSearch: { scope: "smart-search", max: 90, windowSeconds: 60 },
  metricLog: { scope: "metric-log", max: 120, windowSeconds: 60 },
  register: { scope: "register", max: 5, windowSeconds: 600 },
  partnerLead: { scope: "partner-lead", max: 5, windowSeconds: 600 },
  profileClaim: { scope: "profile-claim", max: 3, windowSeconds: 3600 },
  businessLead: { scope: "business-lead", max: 5, windowSeconds: 600 },
} as const satisfies Record<string, RateLimitRule>;

/** true = dentro do limite. Falha aberta: erro de banco ou flag `public_rate_limit` desligada nunca derruba o site. */
export async function withinRateLimit(rule: RateLimitRule): Promise<boolean> {
  try {
    if (!(await isFeatureEnabled("public_rate_limit", true))) return true;
    const ip = clientIpFrom((await headers()).get("x-forwarded-for"));
    const { data, error } = await createServiceClient().rpc("rate_limit_hit", {
      p_key: rateLimitKey(rule.scope, ip),
      p_window_seconds: rule.windowSeconds,
      p_max: rule.max,
    });
    if (error) throw error;
    return data !== false;
  } catch (error) {
    console.error("[rate-limit] falhou, liberando:", error);
    return true;
  }
}
