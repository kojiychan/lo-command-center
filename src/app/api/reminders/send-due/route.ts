import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplateEmail } from "@/server/services/email";
import { sendTemplateSms } from "@/server/services/sms";
import type { ReminderTemplateKey } from "@/domain/reminders";

const STALE_REMINDER_WINDOW_MS = 6 * 60 * 60 * 1000;

export async function GET(request: Request) {
  return processDueReminders(request);
}

export async function POST(request: Request) {
  return processDueReminders(request);
}

async function processDueReminders(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service role key is missing." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.REMINDER_CRON_SECRET || process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_REMINDER_WINDOW_MS).toISOString();

  const { error: staleError } = await admin
    .from("reminder_events")
    .update({
      status: "skipped",
      provider_message: "Skipped because the reminder was more than 6 hours overdue.",
    })
    .eq("status", "pending")
    .in("channel", ["email", "sms"])
    .lt("scheduled_for", staleBefore)
    .in("template_key", ["day_before", "morning_of", "one_hour", "ten_min", "started", "post_followup"]);

  if (staleError) {
    return NextResponse.json({ error: staleError.message }, { status: 500 });
  }

  const { data: events, error } = await admin
    .from("reminder_events")
    .select("id, lead_id, webinar_id, template_key, channel, scheduled_for, webinars ( user_id )")
    .eq("status", "pending")
    .in("channel", ["email", "sms"])
    .gte("scheduled_for", staleBefore)
    .lte("scheduled_for", now.toISOString())
    .in("template_key", ["day_before", "morning_of", "one_hour", "ten_min", "started", "post_followup"])
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

    const payload = {
      userId: webinar.user_id,
      webinarId: event.webinar_id,
      leadId: event.lead_id,
      templateKey: event.template_key as ReminderTemplateKey,
    };
    const result =
      event.channel === "email" ? await sendTemplateEmail(payload) : await sendTemplateSms(payload);

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
        .update({
          status: "sent",
          provider_message: event.channel === "email" ? "Resend email queued." : "Twilio SMS queued.",
        })
        .eq("id", event.id);
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
