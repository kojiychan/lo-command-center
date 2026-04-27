import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FOLLOW_UP_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDashboardData } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const {
    webinarCount,
    upcomingCount,
    registrantCount,
    attendedCount,
    bookedCount,
    leads,
  } = await getDashboardData(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Turn ad clicks into attendees, then attendees into booked calls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat title="Webinars" value={String(webinarCount)} hint="All-time" />
        <Stat title="Upcoming" value={String(upcomingCount)} hint="Scheduled ahead" />
        <Stat title="Registrants" value={String(registrantCount)} hint="Across webinars" />
        <Stat title="Attended" value={String(attendedCount)} hint="Marked attended" />
        <Stat title="Booked calls" value={String(bookedCount)} hint="Pipeline wins" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent leads"
            subtitle="Newest registrants across your webinar pages."
          />

          {leads.length === 0 ? (
            <EmptyState
              title="No registrants yet"
              description="Create a webinar landing page and send paid traffic to it. Registrations will land here automatically."
              actionHref="/webinars/new"
              actionLabel="Create a webinar"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Lead</th>
                    <th className="pb-2 pr-4 font-medium">Webinar</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Follow-up</th>
                    <th className="pb-2 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => {
                    const w = lead.webinars;
                    return (
                      <tr key={lead.id} className="align-top">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-xs text-slate-500">{lead.email}</div>
                          <div className="text-xs text-slate-500">{lead.phone}</div>
                        </td>
                        <td className="py-3 pr-4">
                          {w ? (
                            <Link
                              href={`/webinars/${w.id}`}
                              className="font-medium text-emerald-700 hover:text-emerald-800"
                            >
                              {w.title}
                            </Link>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone="neutral">{LEAD_STATUS_LABELS[lead.status] ?? lead.status}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone="info">
                            {FOLLOW_UP_LABELS[lead.follow_up_status] ?? lead.follow_up_status}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-600">
                          {formatRelative(lead.registered_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Tonight’s checklist"
            subtitle="Small habits that move the needle on show rate."
          />
          <ul className="space-y-3 text-sm text-slate-700">
            <li>• Turn on SMS reminders for 1-hour and 10-minute nudges.</li>
            <li>• Mention DPA programs in your confirmation copy (specific beats vague).</li>
            <li>• After the webinar, send follow-up within 2 hours while motivation is high.</li>
          </ul>
          <div className="mt-5">
            <Link
              href="/webinars/new"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              New webinar landing page →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}
