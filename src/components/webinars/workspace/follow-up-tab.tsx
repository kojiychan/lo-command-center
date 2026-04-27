"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FOLLOW_UP_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { runPostWebinarSequence } from "@/app/actions/leads";
import type { Lead } from "@/types/database";

export function FollowUpTab({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const targets = leads.filter((l) =>
    ["registered", "attended", "no_show", "booked_call", "closed"].includes(l.status),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Post-webinar automations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Trigger the right email/SMS sequence based on what happened after the webinar.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Follow-up</th>
              <th className="px-4 py-3 font-medium">Automation sequence</th>
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
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <Button
                        size="sm"
                        type="button"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await runPostWebinarSequence(lead.id, "attended_cta");
                            router.refresh();
                          })
                        }
                      >
                        Send CTA reminder
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await runPostWebinarSequence(lead.id, "no_show_one_on_one");
                            router.refresh();
                          })
                        }
                      >
                        Send 1:1 invite
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await runPostWebinarSequence(lead.id, "booked_call_prep");
                            router.refresh();
                          })
                        }
                      >
                        Send prep
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await runPostWebinarSequence(lead.id, "closed_client_onboarding");
                            router.refresh();
                          })
                        }
                      >
                        Move to onboarding
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Automations update the pipeline state and stamp mocked email/SMS sends into reminder events.
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
