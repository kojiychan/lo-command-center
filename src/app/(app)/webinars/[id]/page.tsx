import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WebinarWorkspace } from "@/components/webinars/webinar-workspace";
import type { Lead, ReminderEvent, ReminderTemplate, Webinar, WebinarPage } from "@/types/database";

export default async function WebinarDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: webinar, error } = await supabase
    .from("webinars")
    .select(
      `
      *,
      webinar_pages (*),
      leads (*)
    `,
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !webinar) {
    notFound();
  }

  const pageRaw = webinar.webinar_pages as WebinarPage | WebinarPage[] | null | undefined;
  const page: WebinarPage | null = Array.isArray(pageRaw) ? pageRaw[0] ?? null : pageRaw ?? null;

  if (!page) {
    notFound();
  }

  const leadsRaw = webinar.leads as Lead[] | null | undefined;
  const leadRows = (Array.isArray(leadsRaw) ? leadsRaw : []).sort(
    (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime(),
  );

  const { data: templates } = await supabase
    .from("reminder_templates")
    .select("*")
    .eq("webinar_id", webinar.id)
    .order("template_key", { ascending: true });

  const { data: reminderEvents } = await supabase
    .from("reminder_events")
    .select("*")
    .eq("webinar_id", webinar.id)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  const { webinar_pages, leads: _joinedLeads, ...webinarRow } = webinar;
  void webinar_pages;
  void _joinedLeads;

  return (
    <WebinarWorkspace
      webinar={webinarRow as Webinar}
      page={page}
      leads={leadRows}
      templates={(templates ?? []) as ReminderTemplate[]}
      reminderEvents={(reminderEvents ?? []) as ReminderEvent[]}
    />
  );
}
