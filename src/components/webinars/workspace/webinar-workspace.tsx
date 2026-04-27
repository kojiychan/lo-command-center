"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatWebinarDate } from "@/lib/format";
import { PipelineHeader, type PipelineStage } from "@/components/webinars/pipeline-header";
import { OverviewTab } from "@/components/webinars/workspace/overview-tab";
import { LeadsTab } from "@/components/webinars/workspace/leads-tab";
import { RemindersTab } from "@/components/webinars/workspace/reminders-tab";
import { FollowUpTab } from "@/components/webinars/workspace/follow-up-tab";
import type {
  WebinarWorkspaceProps,
  WorkspaceTab,
} from "@/components/webinars/workspace/types";

export function WebinarWorkspace({
  webinar,
  page,
  leads,
  templates,
  reminderEvents,
}: WebinarWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [stageFilter, setStageFilter] = useState<PipelineStage>("all");

  const stats = useMemo(() => {
    const total = leads.length;
    const attended = leads.filter((l) => l.status === "attended").length;
    const booked = leads.filter((l) => l.status === "booked_call").length;
    const noShow = leads.filter((l) => l.status === "no_show").length;
    return { total, attended, booked, noShow };
  }, [leads]);

  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
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
        <OverviewTab
          webinar={webinar}
          page={page}
          stats={stats}
          reminderEvents={reminderEvents}
        />
      ) : null}

      {tab === "leads" ? (
        <LeadsTab leads={leads} page={page} webinar={webinar} activeStage={stageFilter} />
      ) : null}

      {tab === "reminders" ? (
        <RemindersTab webinarId={webinar.id} templates={templates} reminderEvents={reminderEvents} />
      ) : null}

      {tab === "followup" ? <FollowUpTab leads={leads} /> : null}
    </div>
  );
}
