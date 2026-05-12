"use client";

import type { ReminderEvent, Webinar, WebinarPage } from "@/types/database";
import type { OverviewStats } from "@/components/webinars/workspace/types";
import { Button } from "@/components/ui/button";
import { updateWebinarContent } from "@/app/actions/webinars";

export function OverviewTab({
  webinar,
  page,
  stats,
  reminderEvents,
}: {
  webinar: Webinar;
  page: WebinarPage;
  stats: OverviewStats;
  reminderEvents: ReminderEvent[];
}) {
  const pending = reminderEvents.filter((e) => e.status === "pending").length;
  const sent = reminderEvents.filter((e) => e.status === "sent").length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-900">Funnel snapshot</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MiniStat label="Registrants" value={String(stats.total)} />
          <MiniStat label="Attended" value={String(stats.attended)} />
          <MiniStat label="No-shows" value={String(stats.noShow)} />
          <MiniStat label="Booked calls" value={String(stats.booked)} />
        </div>
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Reminder queue (mocked)</div>
          <p className="mt-1 text-slate-600">
            Pending events: <span className="font-semibold">{pending}</span> · Sent (mock):{" "}
            <span className="font-semibold">{sent}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Integration note: connect a worker/cron to read `reminder_events` where `status=pending` and send via
            Twilio/SendGrid, then flip status to `sent` with provider IDs.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">On-air details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Host</dt>
            <dd className="text-slate-900">{webinar.host_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</dt>
            <dd className="text-slate-900">{page.headline}</dd>
          </div>
          {webinar.cta_text ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">CTA</dt>
              <dd className="text-slate-900">{webinar.cta_text}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <form
        action={async (formData) => {
          await updateWebinarContent(formData);
        }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3"
      >
        <input type="hidden" name="webinar_id" value={webinar.id} />
        <input type="hidden" name="cta_text" value={webinar.cta_text ?? ""} />
        <input type="hidden" name="button_text" value={page.button_text} />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Landing page content</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit the content generated from your webinar template.
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Webinar title</span>
            <input
              name="title"
              defaultValue={webinar.title}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
            <textarea
              name="description"
              defaultValue={webinar.description ?? ""}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</span>
            <input
              name="headline"
              defaultValue={page.headline}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subheadline</span>
            <textarea
              name="subheadline"
              defaultValue={page.subheadline ?? ""}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero bullets</span>
            <textarea
              name="hero_bullets"
              defaultValue={(page.hero_bullets ?? []).join("\n")}
              rows={6}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
            <span className="text-xs text-slate-500">One bullet per line.</span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda</span>
            <textarea
              name="agenda_items"
              defaultValue={(page.agenda_items ?? []).join("\n")}
              rows={6}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
            <span className="text-xs text-slate-500">One agenda item per line.</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" size="sm">Save landing content</Button>
        </div>
      </form>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
