"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOLLOW_UP_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { updateLeadStatus } from "@/app/actions/leads";
import type { Lead, LeadStatus, Webinar } from "@/types/database";

export type PipelineBoardLead = Lead & {
  webinars: Pick<Webinar, "id" | "title" | "starts_at" | "timezone"> | null;
};

type PipelineColumn = {
  key: LeadStatus;
  label: string;
  hint: string;
  border: string;
  header: string;
};

const columns: PipelineColumn[] = [
  {
    key: "registered",
    label: "Registered",
    hint: "Needs attendance",
    border: "border-sky-200",
    header: "bg-sky-50 text-sky-800",
  },
  {
    key: "attended",
    label: "Attended",
    hint: "Hot follow-up",
    border: "border-emerald-200",
    header: "bg-emerald-50 text-emerald-800",
  },
  {
    key: "no_show",
    label: "Did not attend",
    hint: "Replay or invite",
    border: "border-amber-200",
    header: "bg-amber-50 text-amber-800",
  },
  {
    key: "booked_call",
    label: "Booked call",
    hint: "Sales conversation",
    border: "border-violet-200",
    header: "bg-violet-50 text-violet-800",
  },
  {
    key: "closed",
    label: "Closed",
    hint: "Converted",
    border: "border-slate-300",
    header: "bg-slate-100 text-slate-800",
  },
];

export function PipelineBoard({ leads }: { leads: PipelineBoardLead[] }) {
  const router = useRouter();
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<LeadStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    return columns.reduce<Record<LeadStatus, number>>(
      (memo, column) => {
        memo[column.key] = leads.filter((lead) => lead.status === column.key).length;
        return memo;
      },
      { registered: 0, attended: 0, no_show: 0, booked_call: 0, closed: 0 },
    );
  }, [leads]);

  function moveLead(lead: PipelineBoardLead, status: LeadStatus) {
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

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No prospects in the pipeline yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Create a webinar landing page and share it. New registrants will appear here automatically.
        </p>
        <Link
          href="/webinars/new"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          New webinar
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Sales funnel</div>
          <div className="text-xs text-slate-500">Drag prospects between stages to update their pipeline status.</div>
        </div>
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{leads.length}</span> prospects
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="grid min-w-[980px] grid-cols-5 gap-3 xl:min-w-0">
          {columns.map((column) => {
            const columnLeads = leads.filter((lead) => lead.status === column.key);

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
                  "flex min-h-[520px] flex-col rounded-lg border bg-slate-50/60 transition",
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
                      {counts[column.key]}
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
                      <PipelineLeadCard
                        key={lead.id}
                        lead={lead}
                        pending={isPending && pendingLeadId === lead.id}
                        dragging={draggingLeadId === lead.id}
                        onDragStart={() => setDraggingLeadId(lead.id)}
                        onDragEnd={() => setDraggingLeadId(null)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipelineLeadCard({
  lead,
  pending,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  lead: PipelineBoardLead;
  pending: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const webinar = lead.webinars;
  const color = webinarColor(webinar?.id ?? lead.webinar_id);
  const className = webinar?.title ?? "Webinar";

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
          {webinar ? (
            <Link
              href={`/webinars/${webinar.id}`}
              className={`mt-1 inline-flex max-w-full truncate rounded-md px-2 py-1 text-[11px] font-semibold transition hover:brightness-95 ${color.badge}`}
            >
              {className}
            </Link>
          ) : (
            <span className={`mt-1 inline-flex max-w-full truncate rounded-md px-2 py-1 text-[11px] font-semibold ${color.badge}`}>
              {className}
            </span>
          )}
        </div>
        <span
          className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${color.dot}`}
          aria-label={`${webinar?.title ?? "Webinar"} color indicator`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {LEAD_STATUS_LABELS[lead.status]}
        </span>
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
          {FOLLOW_UP_LABELS[lead.follow_up_status]}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-600">
        <div className="truncate">{lead.email}</div>
        <div>{formatPhone(lead.phone)}</div>
        <div>Registered {new Date(lead.registered_at).toLocaleDateString()}</div>
      </div>
    </article>
  );
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalized.length !== 10) return phone;

  return `(${normalized.slice(0, 3)})${normalized.slice(3, 6)}-${normalized.slice(6)}`;
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
