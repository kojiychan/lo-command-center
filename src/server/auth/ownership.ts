import { createClient } from "@/lib/supabase/server";

export type OwnershipResult<T extends object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function assertWebinarOwner(
  webinarId: string,
  userId: string,
): Promise<OwnershipResult<{ webinarId: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webinars")
    .select("id")
    .eq("id", webinarId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Not allowed" };
  }

  return { ok: true, webinarId: data.id };
}

export async function assertLeadOwner(
  leadId: string,
  userId: string,
): Promise<OwnershipResult<{ webinarId: string; leadId: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, webinar_id")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Lead not found" };
  }

  const gate = await assertWebinarOwner(data.webinar_id, userId);
  if (!gate.ok) {
    return gate;
  }

  return { ok: true, leadId: data.id, webinarId: data.webinar_id };
}
