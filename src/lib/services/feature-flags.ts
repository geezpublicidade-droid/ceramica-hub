import { createServiceClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

/** Lê uma flag da tabela `feature_flags` (cache de 30s por instância). Flag ausente ou erro de leitura = `fallback`. */
export async function isFeatureEnabled(key: string, fallback = false): Promise<boolean> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  let value = fallback;
  try {
    const { data, error } = await createServiceClient().from("feature_flags").select("enabled").eq("key", key).maybeSingle();
    if (!error && data) value = Boolean(data.enabled);
  } catch (error) {
    console.error("[feature-flags] falha ao ler flag:", key, error);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
