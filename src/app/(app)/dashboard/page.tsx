import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FOLLOW_UP_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const nowIso = new Date().toISOString();

  const { count: webinarCount } = await supabase
    .from("webinars")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: upcomingCount } = await supabase
    .from("webinars")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("starts_at", nowIso);

  const webinarIdsRes = await supabase.from("webinars").select("id").eq("user_id", user.id);

  const webinarIds = webinarIdsRes.data?.map((w) => w.id) ?? [];

  let registrantCount = 0;
  let attendedCount = 0;
  let bookedCount = 0;

  if (webinarIds.length > 0) {
    const { count: reg } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("webinar_id", webinarIds);
    registrantCount = reg ?? 0;

    const { count: att } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("webinar_id", webinarIds)
      .eq("status", "attended");
    attendedCount = att ?? 0;

    const { count: book } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("webinar_id", webinarIds)
      .eq("status", "booked_call");
    bookedCount = book ?? 0;
  }

  const recentLeadsRes =
    webinarIds.length === 0
      ? { data: [] as Array<Record<string, unknown>> }
      : await supabase
          .from("leads")
          .select(
            `
      id,
      first_name,
      last_name,
      email,
      phone,
      status,
      follow_up_status,
      registered_at,
      webinars (
        id,
        title,
        starts_at,
        timezone
      )
    `,
          )
          .in("webinar_id", webinarIds)
          .order("registered_at", { ascending: false })
          .limit(10);

  const leads = (recentLeadsRes.data ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    status: string;
    follow_up_status: string;
    registered_at: string;
    webinars: { id: string; title: string; starts_at: string; timezone: string } | null;
  }>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Turn ad clicks into attendees, then attendees into booked calls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat title="Webinars" value={String(webinarCount ?? 0)} hint="All-time" />
        <Stat title="Upcoming" value={String(upcomingCount ?? 0)} hint="Scheduled ahead" />
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
