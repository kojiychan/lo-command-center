"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FOLLOW_UP_LABELS, LEAD_STATUS_LABELS, REMINDER_LABELS } from "@/lib/constants";
import { formatWebinarDate } from "@/lib/format";
import { PipelineHeader, type PipelineStage } from "@/components/webinars/pipeline-header";
import {
  addLeadNote,
  mockSendFollowUp,
  updateLeadFollowUp,
  updateLeadStatus,
} from "@/app/actions/leads";
import { updateWebinarReminderTemplate } from "@/app/actions/templates";
import type {
  FollowUpStatus,
  Lead,
  LeadStatus,
  ReminderEvent,
  ReminderTemplate,
  ReminderTemplateKey,
  Webinar,
  WebinarPage,
} from "@/types/database";

type Tab = "overview" | "leads" | "reminders" | "followup";

export function WebinarWorkspace({
  webinar,
  page,
  leads,
  templates,
  reminderEvents,
}: {
  webinar: Webinar;
  page: WebinarPage;
  leads: Lead[];
  templates: ReminderTemplate[];
  reminderEvents: ReminderEvent[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [stageFilter, setStageFilter] = useState<PipelineStage>("all");

  const stats = useMemo(() => {
    const total = leads.length;
    const attended = leads.filter((l) => l.status === "attended").length;
    const booked = leads.filter((l) => l.status === "booked_call").length;
    const noShow = leads.filter((l) => l.status === "no_show").length;
    return { total, attended, booked, noShow };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (stageFilter === "all") return leads;
    if (stageFilter === "registered") return leads;
    if (stageFilter === "attended") return leads.filter((l) => l.status === "attended");
    if (stageFilter === "no_show") return leads.filter((l) => l.status === "no_show");
    if (stageFilter === "booked") return leads.filter((l) => l.status === "booked_call");
    if (stageFilter === "applied")
      return leads.filter((l) => l.status === "closed" || l.follow_up_status === "converted");
    return leads;
  }, [leads, stageFilter]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "leads", label: "Leads" },
    { id: "reminders", label: "Reminders" },
    { id: "followup", label: "Follow-up" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{webinar.title}</h1>
            <Badge tone="neutral">{formatWebinarDate(webinar.starts_at, webinar.timezone)}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{webinar.description}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Link
            href={`/w/${page.slug}`}
            target="_blank"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Open landing page →
          </Link>
          <span className="text-xs text-slate-500">
            Hosted at <span className="font-mono">/w/{page.slug}</span>
          </span>
        </div>
      </div>

      <PipelineHeader
        registrations={leads}
        activeStage={stageFilter}
        onFilterChange={(stage) => {
          setStageFilter(stage);
          setTab("leads");
        }}
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              tab === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <Overview
          webinar={webinar}
          page={page}
          stats={stats}
          reminderEvents={reminderEvents}
        />
      ) : null}

      {tab === "leads" ? (
        <Leads leads={filteredLeads} page={page} activeStage={stageFilter} />
      ) : null}

      {tab === "reminders" ? (
        <Reminders webinarId={webinar.id} templates={templates} reminderEvents={reminderEvents} />
      ) : null}

      {tab === "followup" ? <FollowUp leads={leads} /> : null}
    </div>
  );
}

function Overview({
  webinar,
  page,
  stats,
  reminderEvents,
}: {
  webinar: Webinar;
  page: WebinarPage;
  stats: { total: number; attended: number; booked: number; noShow: number };
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

function Leads({
  leads,
  page,
  activeStage,
}: {
  leads: Lead[];
  page: WebinarPage;
  activeStage: PipelineStage;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Registrants</div>
        <div className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-semibold text-slate-900">{leads.length}</span>{" "}
          {activeStage === "all" ? "total" : activeStage.replace("_", "-")}
        </div>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Webinar</th>
            <th className="px-4 py-3 font-medium">Registered</th>
            <th className="px-4 py-3 font-medium">Attendance</th>
            <th className="px-4 py-3 font-medium">Follow-up</th>
            <th className="px-4 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <tr>
              <td className="px-4 py-10 text-center text-slate-600" colSpan={8}>
                No registrants yet. Share your page:{" "}
                <Link className="font-semibold text-emerald-700" href={`/w/${page.slug}`} target="_blank">
                  /w/{page.slug}
                </Link>
              </td>
            </tr>
          ) : (
            leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [followUp, setFollowUp] = useState<FollowUpStatus>(lead.follow_up_status);

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900">
          {lead.first_name} {lead.last_name}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700">{lead.phone}</td>
      <td className="px-4 py-3 text-slate-700">{lead.email}</td>
      <td className="px-4 py-3 text-slate-500">This webinar</td>
      <td className="px-4 py-3 text-slate-600">{new Date(lead.registered_at).toLocaleString()}</td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            size="sm"
            type="button"
            disabled={pending || status === lead.status}
            onClick={() =>
              startTransition(async () => {
                await updateLeadStatus(lead.id, status);
                router.refresh();
              })
            }
          >
            Save attendance
          </Button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value as FollowUpStatus)}
          >
            {Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            size="sm"
            type="button"
            disabled={pending || followUp === lead.follow_up_status}
            onClick={() =>
              startTransition(async () => {
                await updateLeadFollowUp(lead.id, followUp);
                router.refresh();
              })
            }
          >
            Save follow-up
          </Button>
        </div>
      </td>
      <td className="px-4 py-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Call notes, program eligibility, spouse name…"
          className="min-h-[90px]"
        />
        <Button
          className="mt-2"
          size="sm"
          type="button"
          disabled={pending || note.trim().length === 0}
          onClick={() =>
            startTransition(async () => {
              await addLeadNote(lead.id, note);
              setNote("");
              router.refresh();
            })
          }
        >
          Add note
        </Button>
      </td>
    </tr>
  );
}

function Reminders({
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

function FollowUp({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const targets = leads.filter((l) => l.status === "attended" || l.status === "no_show" || l.status === "registered");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Post-webinar workflow</h2>
        <p className="mt-1 text-sm text-slate-600">
          After your session, move fast: attended leads get a follow-up while motivation is high; no-shows get a
          second chance invite.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Follow-up</th>
              <th className="px-4 py-3 font-medium">Quick actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targets.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-600" colSpan={4}>
                  No leads in follow-up scope yet.
                </td>
              </tr>
            ) : (
              targets.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {lead.first_name} {lead.last_name}
                    </div>
                    <div className="text-xs text-slate-500">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{FOLLOW_UP_LABELS[lead.follow_up_status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        type="button"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await mockSendFollowUp(lead.id);
                            router.refresh();
                          })
                        }
                      >
                        Send follow-up (mock)
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateLeadStatus(lead.id, "booked_call");
                            router.refresh();
                          })
                        }
                      >
                        Mark booked call
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateLeadFollowUp(lead.id, "converted");
                            await updateLeadStatus(lead.id, "closed");
                            router.refresh();
                          })
                        }
                      >
                        Mark converted
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      “Send follow-up” updates pipeline state and stamps mock provider notes on post-webinar reminder
                      rows.
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
