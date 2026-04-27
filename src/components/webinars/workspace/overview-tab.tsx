"use client";

import type { ReminderEvent, Webinar, WebinarPage } from "@/types/database";
import type { OverviewStats } from "@/components/webinars/workspace/types";

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
