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
    .select("*")
    .eq("id", webinarId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !webinar) {
    if (error) console.error("Webinar workspace load failed:", error.message);
    notFound();
  }

  const { data: page, error: pageError } = await supabase
    .from("webinar_pages")
    .select("*")
    .eq("webinar_id", webinar.id)
    .maybeSingle();

  if (pageError || !page) {
    if (pageError) console.error("Webinar page load failed:", pageError.message);
    notFound();
  }

  const { data: leadsRaw, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("webinar_id", webinar.id)
    .order("registered_at", { ascending: false });

  if (leadsError) {
    console.error("Webinar leads load failed:", leadsError.message);
  }

  const baseLeads = (leadsRaw ?? []) as Lead[];
  const leadIds = baseLeads.map((lead) => lead.id);

  const [{ data: emailMessages, error: emailError }, { data: smsMessages, error: smsError }] =
    leadIds.length > 0
      ? await Promise.all([
          supabase
            .from("email_messages")
            .select("*")
            .in("lead_id", leadIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("sms_messages")
            .select("*")
            .in("lead_id", leadIds)
            .order("created_at", { ascending: false }),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

  if (emailError) console.error("Email history load failed:", emailError.message);
  if (smsError) console.error("SMS history load failed:", smsError.message);

  const emailByLead = new Map<string, NonNullable<Lead["email_messages"]>>();
  for (const message of emailMessages ?? []) {
    if (!message.lead_id) continue;
    const current = emailByLead.get(message.lead_id) ?? [];
    current.push(message);
    emailByLead.set(message.lead_id, current);
  }

  const smsByLead = new Map<string, NonNullable<Lead["sms_messages"]>>();
  for (const message of smsMessages ?? []) {
    if (!message.lead_id) continue;
    const current = smsByLead.get(message.lead_id) ?? [];
    current.push(message);
    smsByLead.set(message.lead_id, current);
  }

  const leads = baseLeads
    .map((lead) => ({
      ...lead,
      email_messages: emailByLead.get(lead.id) ?? [],
      sms_messages: smsByLead.get(lead.id) ?? [],
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

  return {
    webinar: webinar as Webinar,
    page: page as WebinarPage,
    leads,
    templates: (templates ?? []) as ReminderTemplate[],
    reminderEvents: (reminderEvents ?? []) as ReminderEvent[],
  };
}
