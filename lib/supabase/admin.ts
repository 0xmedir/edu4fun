import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// DANGER: bypasses Row-Level Security entirely.
// Only import from Server Actions / Route Handlers.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
