"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOLLOW_UP_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { updateLeadStatus } from "@/app/actions/leads";
import type { PipelineStage } from "@/components/webinars/pipeline-header";
import type { Lead, LeadStatus, Webinar, WebinarPage } from "@/types/database";

export function LeadsTab({
  leads,
  page,
  webinar,
  activeStage,
}: {
  leads: Lead[];
  page: WebinarPage;
  webinar: Webinar;
  activeStage: PipelineStage;
}) {
  const router = useRouter();
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<LeadStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo(
    () => [
      {
        key: "registered" as const,
        label: "Registered",
        hint: "Needs attendance",
        border: "border-sky-200",
        header: "bg-sky-50 text-sky-800",
      },
      {
        key: "attended" as const,
        label: "Attended",
        hint: "Hot follow-up",
        border: "border-emerald-200",
        header: "bg-emerald-50 text-emerald-800",
      },
      {
        key: "no_show" as const,
        label: "Didn't attend",
        hint: "Replay or invite",
        border: "border-amber-200",
        header: "bg-amber-50 text-amber-800",
      },
      {
        key: "booked_call" as const,
        label: "Booked call",
        hint: "Sales conversation",
        border: "border-violet-200",
        header: "bg-violet-50 text-violet-800",
      },
      {
        key: "closed" as const,
        label: "Closed",
        hint: "Converted",
        border: "border-slate-300",
        header: "bg-slate-100 text-slate-800",
      },
    ],
    [],
  );

  const filteredStatuses = useMemo(() => {
    if (activeStage === "attended") return new Set<LeadStatus>(["attended"]);
    if (activeStage === "no_show") return new Set<LeadStatus>(["no_show"]);
    if (activeStage === "booked") return new Set<LeadStatus>(["booked_call"]);
    if (activeStage === "applied") return new Set<LeadStatus>(["closed"]);
    return null;
  }, [activeStage]);

  function moveLead(lead: Lead, status: LeadStatus) {
    if (lead.status === status || pendingLeadId) return;

    setPendingLeadId(lead.id);
    startTransition(async () => {
      try {
        await updateLeadStatus(lead.id, status);
        router.refresh();
      } finally {
        setPendingLeadId(null);
      }
    });
  }

  const visibleTotal = filteredStatuses
    ? leads.filter((lead) => filteredStatuses.has(lead.status)).length
    : leads.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Prospect pipeline</div>
          <div className="text-xs text-slate-500">Drag cards between stages to update attendance and sales status.</div>
        </div>
        <div className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-semibold text-slate-900">{visibleTotal}</span>{" "}
          {activeStage === "all" ? "total" : activeStage.replace("_", "-")}
        </div>
      </div>
      {leads.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-slate-600">
          No registrants yet. Share your page:{" "}
          <Link className="font-semibold text-emerald-700" href={`/w/${page.slug}`} target="_blank">
            /w/{page.slug}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto p-4">
          <div className="grid min-w-[1120px] grid-cols-5 gap-3">
            {columns.map((column) => {
              const columnLeads = leads.filter((lead) => {
                if (lead.status !== column.key) return false;
                return filteredStatuses ? filteredStatuses.has(lead.status) : true;
              });

              return (
                <section
                  key={column.key}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropStage(column.key);
                  }}
                  onDragLeave={() => setDropStage(null)}
                  onDrop={(event) => {
                    event.preventDefault();
                    const leadId = event.dataTransfer.getData("text/plain");
                    const lead = leads.find((item) => item.id === leadId);
                    setDraggingLeadId(null);
                    setDropStage(null);
                    if (lead) moveLead(lead, column.key);
                  }}
                  className={[
                    "flex min-h-[420px] flex-col rounded-lg border bg-slate-50/60 transition",
                    column.border,
                    dropStage === column.key ? "ring-2 ring-emerald-400/40" : "",
                  ].join(" ")}
                >
                  <div className="border-b border-white/80 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${column.header}`}>
                        {column.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-700">
                        {columnLeads.length}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{column.hint}</div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-3">
                    {columnLeads.length === 0 ? (
                      <div className="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 text-center text-xs text-slate-500">
                        Drop prospects here
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          webinar={webinar}
                          pending={isPending && pendingLeadId === lead.id}
                          dragging={draggingLeadId === lead.id}
                          onDragStart={() => setDraggingLeadId(lead.id)}
                          onDragEnd={() => setDraggingLeadId(null)}
                          onMove={(status) => moveLead(lead, status)}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  webinar,
  pending,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  lead: Lead;
  webinar: Webinar;
  pending: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (status: LeadStatus) => void;
}) {
  const color = webinarColor(webinar.id);
  const smsMessages = lead.sms_messages ?? [];
  const [showSms, setShowSms] = useState(false);

  return (
    <article
      draggable={!pending}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", lead.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={[
        "rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm transition",
        dragging ? "opacity-50 ring-2 ring-emerald-400/40" : "hover:shadow-md",
        pending ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">
            {lead.first_name} {lead.last_name}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{lead.email}</div>
        </div>
        <span
          className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${color.dot}`}
          aria-label={`${webinar.title} color indicator`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${color.badge}`}>
          {webinar.title}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {LEAD_STATUS_LABELS[lead.status]}
        </span>
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
          {FOLLOW_UP_LABELS[lead.follow_up_status]}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-600">
        <div>{lead.phone}</div>
        <div>Registered {new Date(lead.registered_at).toLocaleDateString()}</div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowSms((current) => !current)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {showSms ? "Hide" : "Show"} SMS history ({smsMessages.length})
        </button>
        {showSms ? (
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-2">
            {smsMessages.length === 0 ? (
              <div className="text-xs text-slate-500">No SMS messages yet.</div>
            ) : (
              smsMessages.map((message) => (
                <div key={message.id} className="rounded-md bg-white p-2 text-xs text-slate-700 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-slate-900">
                      {message.direction}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                      {message.status}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{message.body}</p>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                  {message.error_message ? (
                    <div className="mt-1 text-[11px] text-red-600">{message.error_message}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <label className="sr-only" htmlFor={`move-${lead.id}`}>
          Move {lead.first_name} {lead.last_name}
        </label>
        <select
          id={`move-${lead.id}`}
          disabled={pending}
          value={lead.status}
          onChange={(event) => onMove(event.target.value as LeadStatus)}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
        >
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              Move to {label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

function webinarColor(id: string) {
  const colors = [
    { dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700" },
    { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
    { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
    { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700" },
    { dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700" },
  ];
  const total = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}
