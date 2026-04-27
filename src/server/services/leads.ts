import { createClient } from "@/lib/supabase/server";
import { assertLeadOwner } from "@/server/auth/ownership";
import type {
  FollowUpStatus,
  LeadStatus,
  ReminderTemplateKey,
} from "@/types/database";
import type { PostWebinarSequence } from "@/domain/leads";

const sequenceConfig: Record<
  PostWebinarSequence,
  {
    label: string;
    templateKey: ReminderTemplateKey;
    status: LeadStatus;
    followUpStatus: FollowUpStatus;
    providerMessage: string;
  }
> = {
  attended_cta: {
    label: "CTA reminder",
    templateKey: "attended_cta",
    status: "attended",
    followUpStatus: "sent",
    providerMessage: "MOCK: attended-but-did-not-book CTA reminder sequence sent.",
  },
  no_show_one_on_one: {
    label: "1:1 invite",
    templateKey: "no_show_one_on_one",
    status: "no_show",
    followUpStatus: "sent",
    providerMessage: "MOCK: no-show one-on-one invite campaign sent.",
  },
  booked_call_prep: {
    label: "booked call prep",
    templateKey: "booked_call_prep",
    status: "booked_call",
    followUpStatus: "sent",
    providerMessage: "MOCK: booked-call prep email/SMS sent.",
  },
  closed_client_onboarding: {
    label: "client onboarding",
    templateKey: "closed_client_onboarding",
    status: "closed",
    followUpStatus: "converted",
    providerMessage: "MOCK: closed lead moved into client onboarding sequence.",
  },
};

async function getEnabledChannels(
  webinarId: string,
  userId: string,
  templateKey: ReminderTemplateKey,
) {
  const supabase = await createClient();
  const { data: webinarTemplate } = await supabase
    .from("reminder_templates")
    .select("email_enabled, sms_enabled")
    .eq("webinar_id", webinarId)
    .eq("template_key", templateKey)
    .maybeSingle();

  const template =
    webinarTemplate ??
    (
      await supabase
        .from("reminder_templates")
        .select("email_enabled, sms_enabled")
        .eq("user_id", userId)
        .is("webinar_id", null)
        .eq("template_key", templateKey)
        .maybeSingle()
    ).data;

  const emailEnabled = template?.email_enabled ?? true;
  const smsEnabled = template?.sms_enabled ?? true;

  return [
    emailEnabled ? "email" : null,
    smsEnabled ? "sms" : null,
  ].filter(Boolean) as Array<"email" | "sms">;
}

export async function updateLeadStatusForUser(
  leadId: string,
  status: LeadStatus,
  userId: string,
) {
  const gate = await assertLeadOwner(leadId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const, webinarId: gate.webinarId };
}

export async function updateLeadFollowUpForUser(
  leadId: string,
  followUpStatus: FollowUpStatus,
  userId: string,
) {
  const gate = await assertLeadOwner(leadId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ follow_up_status: followUpStatus })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const, webinarId: gate.webinarId };
}

export async function addLeadNoteForUser(
  leadId: string,
  body: string,
  userId: string,
) {
  const text = body.trim();
  if (text.length < 1) {
    return { error: "Note is empty" };
  }

  const gate = await assertLeadOwner(leadId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lead_notes").insert({
    lead_id: leadId,
    user_id: userId,
    body: text,
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const, webinarId: gate.webinarId };
}

export async function mockSendFollowUpForUser(leadId: string, userId: string) {
  const gate = await assertLeadOwner(leadId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const supabase = await createClient();
  const { error: leadError } = await supabase
    .from("leads")
    .update({ follow_up_status: "sent" })
    .eq("id", leadId);

  if (leadError) {
    return { error: leadError.message };
  }

  const { error: eventsError } = await supabase
    .from("reminder_events")
    .update({
      status: "sent",
      provider_message:
        "MOCK: follow-up queued (wire SendGrid/Twilio here using `reminder_templates.post_followup`).",
    })
    .eq("lead_id", leadId)
    .eq("template_key", "post_followup");

  if (eventsError) {
    return { error: eventsError.message };
  }

  return { ok: true as const, webinarId: gate.webinarId };
}

export async function runPostWebinarSequenceForUser(
  leadId: string,
  sequence: PostWebinarSequence,
  userId: string,
) {
  const gate = await assertLeadOwner(leadId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const config = sequenceConfig[sequence];
  const supabase = await createClient();
  const { error: leadError } = await supabase
    .from("leads")
    .update({
      status: config.status,
      follow_up_status: config.followUpStatus,
    })
    .eq("id", leadId);

  if (leadError) {
    return { error: leadError.message };
  }

  const channels = await getEnabledChannels(gate.webinarId, userId, config.templateKey);
  if (channels.length > 0) {
    const now = new Date().toISOString();
    const { error: eventError } = await supabase.from("reminder_events").insert(
      channels.map((channel) => ({
        lead_id: leadId,
        webinar_id: gate.webinarId,
        template_key: config.templateKey,
        channel,
        scheduled_for: now,
        status: "sent",
        provider_message: `${config.providerMessage} Wire ${
          channel === "email" ? "SendGrid" : "Twilio"
        } here.`,
      })),
    );

    if (eventError) {
      return { error: eventError.message };
    }
  }

  return { ok: true as const, webinarId: gate.webinarId, sequence: config.label };
}
