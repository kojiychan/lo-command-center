import { createClient } from "@/lib/supabase/server";
import type { FollowUpStatus, LeadStatus } from "@/types/database";

export type DashboardLead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  follow_up_status: FollowUpStatus;
  registered_at: string;
  webinars: { id: string; title: string; starts_at: string; timezone: string } | null;
};

export async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { count: webinarCount } = await supabase
    .from("webinars")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: upcomingCount } = await supabase
    .from("webinars")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("starts_at", nowIso);

  const webinarIdsRes = await supabase.from("webinars").select("id").eq("user_id", userId);
  const webinarIds = webinarIdsRes.data?.map((w) => w.id) ?? [];

  let registrantCount = 0;
  let attendedCount = 0;
  let bookedCount = 0;

  if (webinarIds.length > 0) {
    const { count: reg } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("webinar_id", webinarIds);
    registrantCount = reg ?? 0;

    const { count: att } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("webinar_id", webinarIds)
      .eq("status", "attended");
    attendedCount = att ?? 0;

    const { count: book } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("webinar_id", webinarIds)
      .eq("status", "booked_call");
    bookedCount = book ?? 0;
  }

  const recentLeadsRes =
    webinarIds.length === 0
      ? { data: [] as DashboardLead[] }
      : await supabase
          .from("leads")
          .select(
            `
            id,
            first_name,
            last_name,
            email,
            phone,
            status,
            follow_up_status,
            registered_at,
            webinars (
              id,
              title,
              starts_at,
              timezone
            )
          `,
          )
          .in("webinar_id", webinarIds)
          .order("registered_at", { ascending: false })
          .limit(10);

  return {
    webinarCount: webinarCount ?? 0,
    upcomingCount: upcomingCount ?? 0,
    registrantCount,
    attendedCount,
    bookedCount,
    leads: (recentLeadsRes.data ?? []) as DashboardLead[],
  };
}
