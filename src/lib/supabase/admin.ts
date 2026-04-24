import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server actions (public registration, reminder row creation).
 *
 * Production hardening ideas:
 * - Move this logic to Supabase Edge Functions + `supabase.functions.invoke`
 * - Replace with `SECURITY DEFINER` RPCs so the app never ships the service role
 * - Wire Twilio / SendGrid in that same Edge Function when reminders should actually send
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
