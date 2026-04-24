"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FollowUpStatus, LeadStatus } from "@/types/database";

const statusSchema = z.enum([
  "registered",
  "attended",
  "no_show",
  "booked_call",
  "closed",
]);

const followUpSchema = z.enum(["none", "pending", "sent", "converted"]);

async function assertLeadOwnership(leadId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, webinar_id")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const, error: "Lead not found" };
  }

  const { data: webinar, error: webinarError } = await supabase
    .from("webinars")
    .select("id")
    .eq("id", data.webinar_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (webinarError || !webinar) {
    return { ok: false as const, error: "Not allowed" };
  }

  return { ok: true as const, webinarId: data.webinar_id };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const gate = await assertLeadOwnership(leadId, user.id);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/webinars/${gate.webinarId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLeadFollowUp(
  leadId: string,
  followUpStatus: FollowUpStatus,
) {
  const parsed = followUpSchema.safeParse(followUpStatus);
  if (!parsed.success) {
    return { error: "Invalid follow-up status" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const gate = await assertLeadOwnership(leadId, user.id);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const { error } = await supabase
    .from("leads")
    .update({ follow_up_status: parsed.data })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/webinars/${gate.webinarId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addLeadNote(leadId: string, body: string) {
  const text = body.trim();
  if (text.length < 1) {
    return { error: "Note is empty" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const gate = await assertLeadOwnership(leadId, user.id);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const { error } = await supabase.from("lead_notes").insert({
    lead_id: leadId,
    user_id: user.id,
    body: text,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/webinars/${gate.webinarId}`);
  return { ok: true };
}

/**
 * MVP "send follow-up" — marks pipeline state and stamps a provider_message on recent post-webinar reminder rows.
 *
 * Integration point: enqueue email/SMS via SendGrid + Twilio using rendered templates from `reminder_templates`.
 */
export async function mockSendFollowUp(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const gate = await assertLeadOwnership(leadId, user.id);
  if (!gate.ok) {
    return { error: gate.error };
  }

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

  revalidatePath(`/webinars/${gate.webinarId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
