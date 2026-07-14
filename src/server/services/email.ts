import { Resend } from "resend";
import { formatInTimeZone } from "@/lib/timezone-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReminderTemplateKey } from "@/domain/reminders";

type SendEmailInput = {
  userId: string;
  webinarId?: string | null;
  leadId?: string | null;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
};

type EmailContext = {
  lead_first_name: string;
  webinar_title: string;
  webinar_datetime: string;
  webinar_date: string;
  webinar_time: string;
  webinar_timezone: string;
  join_url: string;
  presenter_name: string;
  company_name: string;
  presenter_email: string;
  unsubscribe_url: string;
};

type EmailMessageRow = {
  id: string;
  provider_message_id: string | null;
};

function resendApiKey() {
  return process.env.RESEND_API_KEY;
}

function allowedSenderDomain() {
  return process.env.EMAIL_FROM_DOMAIN || "arc-mortgage.com";
}

function fallbackFromEmail() {
  return process.env.FALLBACK_FROM_EMAIL || `team@${allowedSenderDomain()}`;
}

function isEmail(value: string | null | undefined) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? "");
}

function isAllowedSenderEmail(value: string | null | undefined) {
  const email = (value ?? "").toLowerCase();
  return isEmail(email) && email.endsWith(`@${allowedSenderDomain().toLowerCase()}`);
}

function formatFrom(name: string, email: string) {
  return `${name} <${email}>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("\n");
}

function appendTextFooter(text: string, context: Pick<EmailContext, "company_name" | "unsubscribe_url">) {
  return `${text.trim()}

---
You're receiving this because you registered for this webinar.
${context.company_name || "RealEstateWebinar.io"}
Unsubscribe: ${context.unsubscribe_url}`;
}

function buildHtmlEmail(body: string, context: Pick<EmailContext, "company_name" | "unsubscribe_url">) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;padding:28px;box-shadow:0 14px 40px rgba(15,23,42,0.06);">
        <div style="font-size:15px;line-height:1.65;color:#334155;">
          ${textToHtml(body)}
        </div>
        <div style="margin-top:28px;border-top:1px solid #e2e8f0;padding-top:16px;font-size:12px;line-height:1.5;color:#64748b;">
          <p style="margin:0 0 8px;">You're receiving this because you registered for this webinar.</p>
          <p style="margin:0 0 8px;">${escapeHtml(context.company_name || "RealEstateWebinar.io")}</p>
          <p style="margin:0;"><a href="${escapeHtml(context.unsubscribe_url)}" style="color:#047857;">Unsubscribe</a></p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

async function getUserProfile(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const [{ data: authData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("full_name, company_name").eq("id", userId).maybeSingle(),
  ]);

  const user = authData.user;
  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  return {
    email: user?.email ?? null,
    name: profile?.full_name || metadataName || user?.email?.split("@")[0] || "Arc Mortgage",
    companyName: profile?.company_name ?? null,
  };
}

async function getUserEmail(userId: string) {
  return (await getUserProfile(userId))?.email ?? null;
}

async function getEmailSettings(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("user_email_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  const userProfile = await getUserProfile(userId);
  const { data: inserted } = await admin
    .from("user_email_settings")
    .upsert(
      {
        user_id: userId,
        email_provider: "platform_resend",
        from_name: userProfile?.name ?? "Arc Mortgage",
        from_email: isAllowedSenderEmail(userProfile?.email) ? userProfile?.email : fallbackFromEmail(),
        reply_to_email: userProfile?.email,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .maybeSingle();

  return inserted;
}

async function logEmail(input: {
  userId: string;
  webinarId?: string | null;
  leadId?: string | null;
  provider: "resend" | "gmail" | "outlook";
  fromEmail: string;
  fromName?: string | null;
  replyToEmail?: string | null;
  toEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  status: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("email_messages")
    .insert({
      user_id: input.userId,
      webinar_id: input.webinarId ?? null,
      lead_id: input.leadId ?? null,
      direction: "outbound",
      provider: input.provider,
      from_email: input.fromEmail,
      from_name: input.fromName ?? null,
      reply_to_email: input.replyToEmail ?? null,
      to_email: input.toEmail,
      subject: input.subject,
      html_body: input.htmlBody,
      text_body: input.textBody,
      provider_message_id: input.providerMessageId ?? null,
      status: input.status,
      error_message: input.errorMessage ?? null,
      sent_at: input.sentAt ?? null,
    })
    .select("id, provider_message_id")
    .single();

  return data as EmailMessageRow | null;
}

async function updateEmailStatus(
  id: string | null | undefined,
  input: {
    status: string;
    providerMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
) {
  if (!id) return;
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("email_messages")
    .update({
      status: input.status,
      provider_message_id: input.providerMessageId ?? undefined,
      error_message: input.errorMessage ?? undefined,
      sent_at: input.sentAt ?? undefined,
    })
    .eq("id", id);
}

export async function sendEmail(input: SendEmailInput) {
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Supabase service role key is missing." };
  }

  const settings = await getEmailSettings(input.userId);
  const provider = settings?.email_provider ?? "platform_resend";
  const userProfile = await getUserProfile(input.userId);
  const userEmail = userProfile?.email ?? null;
  const fromName = userProfile?.name || settings?.from_name || "Arc Mortgage";
  const fromEmail = isAllowedSenderEmail(userEmail) && userEmail ? userEmail : fallbackFromEmail();
  const replyToEmail = input.replyTo || settings?.reply_to_email || userEmail || fallbackFromEmail();

  const initialLog = await logEmail({
    userId: input.userId,
    webinarId: input.webinarId,
    leadId: input.leadId,
    provider: "resend",
    fromEmail,
    fromName,
    replyToEmail,
    toEmail: input.to,
    subject: input.subject,
    htmlBody: input.html,
    textBody: input.text,
    status: "queued",
  });

  if (provider !== "platform_resend") {
    // TODO Phase 4: implement connected_gmail and connected_outlook provider adapters here.
    await updateEmailStatus(initialLog?.id, {
      status: "failed",
      errorMessage: `${provider} sending is not implemented yet.`,
    });
    return { error: `${provider} sending is not implemented yet.` };
  }

  const apiKey = resendApiKey();
  if (!apiKey) {
    await updateEmailStatus(initialLog?.id, {
      status: "failed",
      errorMessage: "Resend is not configured. Add RESEND_API_KEY.",
    });
    return { error: "Resend is not configured." };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: formatFrom(fromName, fromEmail),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: replyToEmail ? [replyToEmail] : undefined,
    });

    if (error) {
      const message = error.message ?? "Resend send failed.";
      await updateEmailStatus(initialLog?.id, { status: "failed", errorMessage: message });
      return { error: message };
    }

    await updateEmailStatus(initialLog?.id, {
      status: "sent",
      providerMessageId: data?.id ?? null,
      sentAt: new Date().toISOString(),
    });
    return { ok: true as const, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend send failed.";
    await updateEmailStatus(initialLog?.id, { status: "failed", errorMessage: message });
    return { error: message };
  }
}

export function renderEmailTemplate(template: string, context: EmailContext) {
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
    .replaceAll("{{company_name}}", context.company_name)
    .replaceAll("{{presenter_email}}", context.presenter_email)
    .replaceAll("{{unsubscribe_url}}", context.unsubscribe_url)
    .replaceAll("{{book_call_link}}", context.join_url);
}

export async function sendTemplateEmail(input: {
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
      email,
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
    .select("email_enabled, email_subject, email_body")
    .eq("webinar_id", input.webinarId)
    .eq("template_key", input.templateKey)
    .maybeSingle();

  if (!template?.email_enabled) return { error: "Email template is disabled." };

  const { data: profile } = await admin
    .from("profiles")
    .select("company_name")
    .eq("id", webinar.user_id)
    .maybeSingle();

  const presenterEmail = await getUserEmail(webinar.user_id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://realestatewebinar.io";
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
  const context: EmailContext = {
    lead_first_name: data.first_name,
    webinar_title: webinar.title,
    webinar_datetime: formatInTimeZone(webinar.starts_at, webinar.timezone),
    webinar_date: webinarDate,
    webinar_time: webinarTime,
    webinar_timezone: webinar.timezone,
    join_url: webinar.join_url,
    presenter_name: webinar.host_name,
    company_name: profile?.company_name ?? "RealEstateWebinar.io",
    presenter_email: presenterEmail ?? "",
    unsubscribe_url: `${siteUrl}/unsubscribe?lead=${encodeURIComponent(data.id)}`,
  };

  const renderedSubject = renderEmailTemplate(template.email_subject ?? webinar.title, context);
  const renderedBody = renderEmailTemplate(template.email_body, context);
  const text = appendTextFooter(renderedBody, context);
  const html = buildHtmlEmail(renderedBody, context);

  return sendEmail({
    userId: input.userId,
    webinarId: input.webinarId,
    leadId: input.leadId,
    to: data.email,
    subject: renderedSubject,
    html,
    text,
    replyTo: presenterEmail,
  });
}
