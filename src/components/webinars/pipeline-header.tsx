"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types/database";

export type PipelineStage = "all" | "registered" | "attended" | "booked" | "applied" | "no_show";

type Props = {
  registrations: Lead[];
  activeStage: PipelineStage;
  onFilterChange: (stage: PipelineStage) => void;
};

type StageStat = {
  key: Exclude<PipelineStage, "all" | "no_show">;
  label: string;
  count: number;
  pctFromPrev: number | null;
};

function pct(n: number, d: number) {
  if (!d) return null;
  return Math.round((n / d) * 100);
}

/**
 * Pipeline mapping (MVP):
 * - registered: all leads
 * - attended: leads.status === 'attended'
 * - booked: leads.status === 'booked_call'
 * - applied: leads.status === 'closed' OR leads.follow_up_status === 'converted'
 * - no_show: leads.status === 'no_show'
 *
 * Future: split into dedicated columns (attendance_status, booked_status, application_status).
 */
export function PipelineHeader({ registrations, activeStage, onFilterChange }: Props) {
  const stats = useMemo(() => {
    const registered = registrations.length;
    const attended = registrations.filter((l) => l.status === "attended").length;
    const booked = registrations.filter((l) => l.status === "booked_call").length;
    const applied = registrations.filter(
      (l) => l.status === "closed" || l.follow_up_status === "converted",
    ).length;
    const noShow = registrations.filter((l) => l.status === "no_show").length;

    const stages: StageStat[] = [
      { key: "registered", label: "Registered", count: registered, pctFromPrev: null },
      { key: "attended", label: "Attended", count: attended, pctFromPrev: pct(attended, registered) },
      { key: "booked", label: "Booked", count: booked, pctFromPrev: pct(booked, attended) },
      { key: "applied", label: "Applied", count: applied, pctFromPrev: pct(applied, booked) },
    ];

    return { stages, registered, attended, booked, applied, noShow };
  }, [registrations]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Webinar pipeline
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Click a stage to filter registrants and take action fast.
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          {stats.registered === 0 ? (
            <Badge tone="neutral">No registrations yet</Badge>
          ) : (
            <div className="text-sm">
              <span className="font-semibold text-slate-900">{stats.noShow}</span>{" "}
              <span className="text-slate-600">No-shows</span>{" "}
              <span className="text-slate-500">
                ({pct(stats.noShow, stats.registered) ?? 0}%)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="flex min-w-[720px] items-stretch gap-3">
          {stats.stages.map((s, idx) => (
            <div key={s.key} className="flex items-stretch gap-3">
              <StageCard
                stageKey={s.key}
                label={s.label}
                count={s.count}
                pctFromPrev={s.pctFromPrev}
                isActive={activeStage === s.key || (activeStage === "all" && s.key === "registered")}
                onClick={() => onFilterChange(s.key)}
                hidePct={idx === 0 || stats.registered === 0}
              />
              {idx < stats.stages.length - 1 ? (
                <div className="hidden items-center text-slate-300 sm:flex" aria-hidden="true">
                  →
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`ml-auto rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              activeStage === "all"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Clear filter
          </button>
        </div>
      </div>
    </div>
  );
}

function StageCard({
  stageKey,
  label,
  count,
  pctFromPrev,
  isActive,
  onClick,
  hidePct,
}: {
  stageKey: "registered" | "attended" | "booked" | "applied";
  label: string;
  count: number;
  pctFromPrev: number | null;
  isActive: boolean;
  onClick: () => void;
  hidePct: boolean;
}) {
  const tone =
    stageKey === "applied" || stageKey === "booked" ? "border-emerald-200" : "border-slate-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-[170px] shrink-0 rounded-2xl border bg-white px-4 py-4 text-left shadow-sm transition",
        tone,
        isActive ? "ring-2 ring-emerald-500/20" : "hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="text-3xl font-semibold tabular-nums text-slate-900">{count}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </div>
      {!hidePct ? (
        <div className="mt-2 text-xs font-medium text-slate-500">
          {pctFromPrev === null ? "—" : `${pctFromPrev}%`}{" "}
          <span className="text-slate-400">from previous</span>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-400"> </div>
      )}
    </button>
  );
}

