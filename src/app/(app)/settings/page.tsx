import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REMINDER_LABELS } from "@/lib/constants";
import {
  DomainSettingsForm,
  EmailSettingsForm,
  ProfileSettingsForm,
  TestimonialsSettingsForm,
} from "@/components/settings/settings-forms";
import { updateUserReminderTemplate } from "@/app/actions/templates";
import type { ReminderTemplate } from "@/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, phone, domain_prefix, short_bio, profile_image_url")
    .eq("id", user.id)
    .maybeSingle();

  const nameParts = (profile?.full_name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const { data: templates } = await supabase
    .from("reminder_templates")
    .select("*")
    .eq("user_id", user.id)
    .is("webinar_id", null)
    .order("template_key", { ascending: true });

  const { data: emailSettings } = await supabase
    .from("user_email_settings")
    .select("from_name, from_email, reply_to_email")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("reviewer_name, reviewer_context, review_text, rating, display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true })
    .limit(3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Defaults for new webinars. Per-webinar overrides live on each webinar’s Reminders tab.
        </p>
      </div>

      <Card>
        <CardHeader title="Profile" subtitle="Update the presenter details reused across webinar pages." />
        <ProfileSettingsForm
          firstName={firstName}
          lastName={lastName}
          companyName={profile?.company_name ?? ""}
          phone={profile?.phone ?? ""}
          shortBio={profile?.short_bio ?? ""}
          profileImageUrl={profile?.profile_image_url ?? null}
        />
      </Card>

      <Card>
        <CardHeader
          title="Webinar domain"
          subtitle="Choose the text that appears before your shared webinar domain."
        />
        <DomainSettingsForm domainPrefix={profile?.domain_prefix ?? ""} />
      </Card>

      <Card>
        <CardHeader
          title="Email sending"
          subtitle="Set the sender name and reply-to address used for webinar emails."
        />
        <EmailSettingsForm
          fromName={emailSettings?.from_name ?? "RealEstateWebinar"}
          fromEmail={
            emailSettings?.from_email ??
            process.env.FALLBACK_FROM_EMAIL ??
            `team@${process.env.EMAIL_FROM_DOMAIN || "arc-mortgage.com"}`
          }
          replyToEmail={emailSettings?.reply_to_email ?? user.email ?? ""}
        />
      </Card>

      <Card>
        <CardHeader
          title="Client reviews"
          subtitle="Edit the testimonials reused across your webinar landing pages."
        />
        <TestimonialsSettingsForm
          testimonials={[0, 1, 2].map((index) => {
            const review = testimonials?.find((item) => item.display_order === index + 1);
            return {
              reviewerName: review?.reviewer_name ?? "",
              reviewerContext: review?.reviewer_context ?? "",
              reviewText: review?.review_text ?? "",
              rating: review?.rating == null ? "5" : String(review.rating),
            };
          })}
        />
      </Card>

      <Card>
        <CardHeader
          title="Default reminder templates"
          subtitle="These seed every new webinar. Edit tone once, then fine-tune per funnel on the webinar page."
        />

        <div className="space-y-6">
          {(templates ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No defaults found yet. They’re created automatically after sign-in; refresh if you just created your
              account.
            </div>
          ) : (
            (templates as ReminderTemplate[]).map((t) => (
              <form
                key={t.id}
                action={updateUserReminderTemplate}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <input type="hidden" name="template_key" value={t.template_key} />
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {REMINDER_LABELS[t.template_key]}
                    </div>
                    <div className="text-xs text-slate-500">Default · key {t.template_key}</div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2 text-slate-700">
                      <input type="checkbox" name="email_enabled" defaultChecked={t.email_enabled} />
                      Email
                    </label>
                    <label className="flex items-center gap-2 text-slate-700">
                      <input type="checkbox" name="sms_enabled" defaultChecked={t.sms_enabled} />
                      SMS
                    </label>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email subject
                    </span>
                    <input
                      name="email_subject"
                      defaultValue={t.email_subject ?? ""}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                    />
                  </label>
                  <div />
                  <label className="block space-y-1.5 lg:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email body</span>
                    <textarea
                      name="email_body"
                      defaultValue={t.email_body}
                      rows={6}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                    />
                  </label>
                  <label className="block space-y-1.5 lg:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">SMS body</span>
                    <textarea
                      name="sms_body"
                      defaultValue={t.sms_body}
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                    />
                  </label>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button size="sm" type="submit">
                    Save default
                  </Button>
                </div>
              </form>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
