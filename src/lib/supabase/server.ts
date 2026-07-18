import { createClient } from "@supabase/supabase-js";

/**
 * Cliente server-only com a service role key — nunca importar este arquivo
 * de um componente "use client". RLS fica em deny-all; toda autorização
 * real acontece no Next.js via sessão do next-auth, não pelo Supabase.
 */
export function createServiceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
