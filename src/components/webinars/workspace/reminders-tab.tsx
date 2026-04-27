"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REMINDER_LABELS } from "@/lib/constants";
import { updateWebinarReminderTemplate } from "@/app/actions/templates";
import type { ReminderEvent, ReminderTemplate, ReminderTemplateKey } from "@/types/database";

export function RemindersTab({
  webinarId,
  templates,
  reminderEvents,
}: {
  webinarId: string;
  templates: ReminderTemplate[];
  reminderEvents: ReminderEvent[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Reminder templates (per webinar)</h2>
        <p className="mt-1 text-sm text-slate-600">
          These are the messages your registrants would receive. Sending is mocked for now — this is where you tune
          conversion copy.
        </p>
        <div className="mt-6 space-y-6">
          {templates.map((t) => (
            <form
              key={t.id}
              action={updateWebinarReminderTemplate}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <input type="hidden" name="webinar_id" value={webinarId} />
              <input type="hidden" name="template_key" value={t.template_key} />
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {REMINDER_LABELS[t.template_key]}
                  </div>
                  <div className="text-xs text-slate-500">Key: {t.template_key}</div>
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
                  Save template
                </Button>
              </div>
            </form>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Scheduled reminder events (latest 50)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each row is one channel send attempt for one registrant. In production, your job runner owns this table.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-4 font-medium">When</th>
                <th className="pb-2 pr-4 font-medium">Template</th>
                <th className="pb-2 pr-4 font-medium">Channel</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reminderEvents.slice(0, 50).map((e) => (
                <tr key={e.id}>
                  <td className="py-2 pr-4 text-slate-700">{new Date(e.scheduled_for).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-slate-700">
                    {REMINDER_LABELS[e.template_key as ReminderTemplateKey] ?? e.template_key}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">{e.channel}</td>
                  <td className="py-2">
                    <Badge tone={e.status === "sent" ? "success" : "neutral"}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
