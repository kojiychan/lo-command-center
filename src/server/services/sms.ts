import { formatInTimeZone } from "@/lib/timezone-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReminderTemplateKey } from "@/domain/reminders";

type SendSmsInput = {
  userId: string;
  webinarId?: string | null;
  leadId?: string | null;
  to: string;
  body: string;
};

type SmsContext = {
  lead_first_name: string;
  webinar_title: string;
  webinar_datetime: string;
  webinar_date: string;
  webinar_time: string;
  webinar_timezone: string;
  join_url: string;
  presenter_name: string;
  company_name: string;
};

type SmsMessageRow = {
  id: string;
  user_id: string;
  webinar_id: string | null;
  lead_id: string | null;
  direction: "outbound" | "inbound";
  to_number: string | null;
  from_number: string | null;
  body: string;
  twilio_message_sid: string | null;
  status: string;
  error_code: string | null;
  error_message: string | null;
  provider: "twilio";
  created_at: string;
  sent_at: string | null;
};

function normalizePhone(value: string | null | undefined) {
  return (value ?? "").replace(/[^\d+]/g, "");
}

function twilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    defaultFromNumber: process.env.TWILIO_DEFAULT_FROM_NUMBER,
  };
}

function twilioStatusCallbackUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/api/twilio/status` : undefined;
}

function appendCompliance(body: string) {
  const compliance = "Reply STOP to opt out. Reply HELP for help.";
  return body.toLowerCase().includes("stop") ? body : `${body}\n${compliance}`;
}

async function getSmsSettings(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("user_sms_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  const config = twilioConfig();
  const { data: inserted } = await admin
    .from("user_sms_settings")
    .upsert(
      {
        user_id: userId,
        sms_provider: "platform_twilio",
        default_from_number: config.defaultFromNumber ?? null,
        messaging_service_sid: config.messagingServiceSid ?? null,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .maybeSingle();

  return inserted;
}

async function logSms(input: {
  userId: string;
  webinarId?: string | null;
  leadId?: string | null;
  direction: "outbound" | "inbound";
  toNumber?: string | null;
  fromNumber?: string | null;
  body: string;
  twilioMessageSid?: string | null;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("sms_messages")
    .insert({
      user_id: input.userId,
      webinar_id: input.webinarId ?? null,
      lead_id: input.leadId ?? null,
      direction: input.direction,
      to_number: input.toNumber ?? null,
      from_number: input.fromNumber ?? null,
      body: input.body,
      twilio_message_sid: input.twilioMessageSid ?? null,
      status: input.status,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      provider: "twilio",
      sent_at: input.sentAt ?? null,
    })
    .select("*")
    .single();

  return data as SmsMessageRow | null;
}

export async function sendSms(input: SendSmsInput) {
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Supabase service role key is missing." };
  }

  const to = normalizePhone(input.to);
  if (!to) {
    return { error: "SMS recipient phone number is missing." };
  }

  const config = twilioConfig();
  const settings = await getSmsSettings(input.userId);
  const messagingServiceSid = settings?.messaging_service_sid ?? config.messagingServiceSid;
  const fromNumber = settings?.default_from_number ?? config.defaultFromNumber ?? null;
  const body = appendCompliance(input.body);

  const initialLog = await logSms({
    userId: input.userId,
    webinarId: input.webinarId,
    leadId: input.leadId,
    direction: "outbound",
    toNumber: to,
    fromNumber: messagingServiceSid ? null : fromNumber,
    body,
    status: "queued",
  });

  if (!config.accountSid || !config.authToken || (!messagingServiceSid && !fromNumber)) {
    await updateSmsStatus(initialLog?.id, {
      status: "failed",
      errorMessage:
        "Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID or TWILIO_DEFAULT_FROM_NUMBER.",
    });
    return { error: "Twilio is not configured." };
  }

  // TODO Phase 2: if sms_provider === dedicated_twilio, use the user's platform-managed subaccount/number.
  // TODO Phase 3: if sms_provider === byo_twilio, decrypt and use the user's BYO Account SID/Auth Token.
  const params = new URLSearchParams({
    To: to,
    Body: body,
  });
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromNumber) {
    params.set("From", fromNumber);
  }
  const callbackUrl = twilioStatusCallbackUrl();
  if (callbackUrl) {
    params.set("StatusCallback", callbackUrl);
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      await updateSmsStatus(initialLog?.id, {
        status: "failed",
        errorCode: payload.code ? String(payload.code) : null,
        errorMessage: payload.message ?? "Twilio send failed.",
      });
      return { error: payload.message ?? "Twilio send failed." };
    }

    await updateSmsStatus(initialLog?.id, {
      status: payload.status ?? "queued",
      twilioMessageSid: payload.sid ?? null,
      sentAt: new Date().toISOString(),
    });
    return { ok: true as const, sid: payload.sid as string | undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Twilio send failed.";
    await updateSmsStatus(initialLog?.id, { status: "failed", errorMessage: message });
    return { error: message };
  }
}

export async function updateSmsStatus(
  id: string | null | undefined,
  input: {
    status: string;
    twilioMessageSid?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
) {
  if (!id) return;
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("sms_messages")
    .update({
      status: input.status,
      twilio_message_sid: input.twilioMessageSid ?? undefined,
      error_code: input.errorCode ?? undefined,
      error_message: input.errorMessage ?? undefined,
      sent_at: input.sentAt ?? undefined,
    })
    .eq("id", id);
}

export function renderSmsTemplate(template: string, context: SmsContext) {
  return template
    .replaceAll("{{lead_first_name}}", context.lead_first_name)
    .replaceAll("{{first_name}}", context.lead_first_name)
    .replaceAll("{{webinar_title}}", context.webinar_title)
    .replaceAll("{{title}}", context.webinar_title)
    .replaceAll("{{webinar_datetime}}", context.webinar_datetime)
    .replaceAll("{{time}}", context.webinar_datetime)
    .replaceAll("{{user_local_time}}", context.webinar_datetime)
    .replaceAll("{{date}}", context.webinar_date)
    .replaceAll("{{time_only}}", context.webinar_time)
    .replaceAll("{{webinar_timezone}}", context.webinar_timezone)
    .replaceAll("{{timezone}}", context.webinar_timezone)
    .replaceAll("{{join_url}}", context.join_url)
    .replaceAll("{{join_link}}", context.join_url)
    .replaceAll("{{presenter_name}}", context.presenter_name)
    .replaceAll("{{host}}", context.presenter_name)
    .replaceAll("{{company_name}}", context.company_name);
}

export async function sendTemplateSms(input: {
  userId: string;
  webinarId: string;
  leadId: string;
  templateKey: ReminderTemplateKey;
}) {
  const admin = createAdminClient();
  if (!admin) return { error: "Supabase service role key is missing." };

  const { data, error } = await admin
    .from("leads")
    .select(
      `
      id,
      first_name,
      phone,
      webinars (
        id,
        user_id,
        title,
        starts_at,
        timezone,
        host_name,
        join_url
      )
    `,
    )
    .eq("id", input.leadId)
    .maybeSingle();

  if (error || !data) return { error: error?.message ?? "Lead not found." };

  const rawWebinar = data.webinars as unknown;
  const webinar = (Array.isArray(rawWebinar) ? rawWebinar[0] : rawWebinar) as
    | {
        id: string;
        user_id: string;
        title: string;
        starts_at: string;
        timezone: string;
        host_name: string;
        join_url: string;
      }
    | null
    | undefined;

  if (!webinar) return { error: "Webinar not found." };

  const { data: template } = await admin
    .from("reminder_templates")
    .select("sms_enabled, sms_body")
    .eq("webinar_id", input.webinarId)
    .eq("template_key", input.templateKey)
    .maybeSingle();

  if (!template?.sms_enabled) return { error: "SMS template is disabled." };

  const { data: profile } = await admin
    .from("profiles")
    .select("company_name")
    .eq("id", webinar.user_id)
    .maybeSingle();

  const webinarDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: webinar.timezone,
  }).format(new Date(webinar.starts_at));
  const webinarTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: webinar.timezone,
  }).format(new Date(webinar.starts_at));

  const body = renderSmsTemplate(template.sms_body, {
    lead_first_name: data.first_name,
    webinar_title: webinar.title,
    webinar_datetime: formatInTimeZone(webinar.starts_at, webinar.timezone),
    webinar_date: webinarDate,
    webinar_time: webinarTime,
    webinar_timezone: webinar.timezone,
    join_url: webinar.join_url,
    presenter_name: webinar.host_name,
    company_name: profile?.company_name ?? "",
  });

  return sendSms({
    userId: input.userId,
    webinarId: input.webinarId,
    leadId: input.leadId,
    to: data.phone,
    body,
  });
}

export async function logInboundSms(input: {
  from: string;
  to: string;
  body: string;
  twilioMessageSid?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return { error: "Supabase service role key is missing." };

  const from = normalizePhone(input.from);
  const { data: lead } = await admin
    .from("leads")
    .select("id, webinar_id, webinars ( user_id )")
    .ilike("phone", `%${from.replace(/^\+?1?/, "")}%`)
    .order("registered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawWebinar = lead?.webinars as unknown;
  const webinar = (Array.isArray(rawWebinar) ? rawWebinar[0] : rawWebinar) as
    | { user_id: string }
    | null
    | undefined;

  if (!lead || !webinar) {
    return { error: "No matching lead found." };
  }

  await logSms({
    userId: webinar.user_id,
    webinarId: lead.webinar_id,
    leadId: lead.id,
    direction: "inbound",
    toNumber: input.to,
    fromNumber: input.from,
    body: input.body,
    twilioMessageSid: input.twilioMessageSid ?? null,
    status: "received",
    sentAt: new Date().toISOString(),
  });

  return { ok: true as const };
}

export async function updateSmsStatusByTwilioSid(input: {
  sid: string;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("sms_messages")
    .update({
      status: input.status,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      sent_at: ["sent", "delivered"].includes(input.status) ? new Date().toISOString() : undefined,
    })
    .eq("twilio_message_sid", input.sid);
}
