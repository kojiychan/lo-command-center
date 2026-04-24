import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatWebinarDate, isUpcoming } from "@/lib/format";

export default async function WebinarsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: webinars } = await supabase
    .from("webinars")
    .select(
      `
      id,
      title,
      starts_at,
      timezone,
      webinar_pages (
        slug
      )
    `,
    )
    .eq("user_id", user.id)
    .order("starts_at", { ascending: true });

  const rows = webinars ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Webinars</h1>
          <p className="mt-1 text-sm text-slate-600">
            Each webinar gets a conversion-focused landing page, CRM, and reminder stack.
          </p>
        </div>
        <Link
          href="/webinars/new"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          New webinar
        </Link>
      </div>

      <Card>
        <CardHeader
          title="Your webinar library"
          subtitle="Open a webinar to manage registrants, reminders, and follow-up."
        />

        {rows.length === 0 ? (
          <EmptyState
            title="Create your first webinar funnel"
            description="Most LOs lose leads between registration and show-up. Start with a simple page + reminders tuned for first-time buyers."
            actionHref="/webinars/new"
            actionLabel="Create webinar"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Webinar</th>
                  <th className="pb-2 pr-4 font-medium">Schedule</th>
                  <th className="pb-2 pr-4 font-medium">Landing page</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((w) => {
                  const pages = w.webinar_pages as
                    | { slug: string }
                    | { slug: string }[]
                    | null
                    | undefined;
                  const slug = Array.isArray(pages) ? pages[0]?.slug : pages?.slug;
                  const upcoming = isUpcoming(w.starts_at);
                  return (
                    <tr key={w.id} className="align-top">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/webinars/${w.id}`}
                          className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          {w.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatWebinarDate(w.starts_at, w.timezone)}
                      </td>
                      <td className="py-3 pr-4">
                        {slug ? (
                          <Link className="text-slate-700 underline" href={`/w/${slug}`} target="_blank">
                            /w/{slug}
                          </Link>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge tone={upcoming ? "success" : "neutral"}>
                          {upcoming ? "Upcoming" : "Past"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
