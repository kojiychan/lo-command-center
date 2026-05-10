import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Lead, ReminderEvent, ReminderTemplate, Webinar, WebinarPage } from "@/types/database";

export type WebinarLibraryRow = {
  id: string;
  title: string;
  starts_at: string;
  timezone: string;
  webinar_pages: { slug: string } | { slug: string }[] | null;
  view_count: number;
  signup_count: number;
};

export async function getWebinarLibrary(userId: string): Promise<WebinarLibraryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("webinars")
    .select(
      `
      id,
      title,
      starts_at,
      timezone,
      webinar_pages (
        slug
      ),
      leads (count),
      webinar_page_views (count)
    `,
    )
    .eq("user_id", userId)
    .order("starts_at", { ascending: true });

  return (data ?? []).map((row) => {
    const raw = row as typeof row & {
      leads?: Array<{ count: number }> | null;
      webinar_page_views?: Array<{ count: number }> | null;
    };

    return {
      id: raw.id,
      title: raw.title,
      starts_at: raw.starts_at,
      timezone: raw.timezone,
      webinar_pages: raw.webinar_pages,
      signup_count: raw.leads?.[0]?.count ?? 0,
      view_count: raw.webinar_page_views?.[0]?.count ?? 0,
    };
  }) as WebinarLibraryRow[];
}

export async function getWebinarWorkspaceData(userId: string, webinarId: string) {
  const supabase = await createClient();
  const { data: webinar, error } = await supabase
    .from("webinars")
    .select(
      `
      *,
      webinar_pages (*),
      leads (
        *,
        sms_messages (*)
      )
    `,
    )
    .eq("id", webinarId)
    .eq("user_id", userId)
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
  const leads = (Array.isArray(leadsRaw) ? leadsRaw : [])
    .map((lead) => ({
      ...lead,
      sms_messages: (lead.sms_messages ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }))
    .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());

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

  return {
    webinar: webinarRow as Webinar,
    page,
    leads,
    templates: (templates ?? []) as ReminderTemplate[],
    reminderEvents: (reminderEvents ?? []) as ReminderEvent[],
  };
}
