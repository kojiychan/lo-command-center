import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplateSms } from "@/server/services/sms";
import type { ReminderTemplateKey } from "@/domain/reminders";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service role key is missing." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.REMINDER_CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: events, error } = await admin
    .from("reminder_events")
    .select("id, lead_id, webinar_id, template_key, channel, webinars ( user_id )")
    .eq("status", "pending")
    .eq("channel", "sms")
    .lte("scheduled_for", new Date().toISOString())
    .in("template_key", ["day_before", "morning_of", "ten_min", "started"])
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const event of events ?? []) {
    const rawWebinar = event.webinars as unknown;
    const webinar = (Array.isArray(rawWebinar) ? rawWebinar[0] : rawWebinar) as
      | { user_id: string }
      | null
      | undefined;

    if (!webinar?.user_id) {
      failed += 1;
      await admin
        .from("reminder_events")
        .update({ status: "failed", provider_message: "Missing webinar owner." })
        .eq("id", event.id);
      continue;
    }

    const result = await sendTemplateSms({
      userId: webinar.user_id,
      webinarId: event.webinar_id,
      leadId: event.lead_id,
      templateKey: event.template_key as ReminderTemplateKey,
    });

    if ("error" in result) {
      failed += 1;
      await admin
        .from("reminder_events")
        .update({ status: "failed", provider_message: result.error })
        .eq("id", event.id);
    } else {
      sent += 1;
      await admin
        .from("reminder_events")
        .update({ status: "sent", provider_message: "Twilio SMS queued." })
        .eq("id", event.id);
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
