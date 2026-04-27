import { createClient } from "@/lib/supabase/server";
import type { PipelineBoardLead } from "@/components/webinars/pipeline-board";

export async function getPipelineLeads(userId: string): Promise<PipelineBoardLead[]> {
  const supabase = await createClient();
  const { data: webinars } = await supabase
    .from("webinars")
    .select("id")
    .eq("user_id", userId);

  const webinarIds = webinars?.map((webinar) => webinar.id) ?? [];
  if (webinarIds.length === 0) {
    return [];
  }

  const { data: leads } = await supabase
    .from("leads")
    .select(
      `
      *,
      webinars (
        id,
        title,
        starts_at,
        timezone
      )
    `,
    )
    .in("webinar_id", webinarIds)
    .order("registered_at", { ascending: false });

  return (leads ?? []) as PipelineBoardLead[];
}
