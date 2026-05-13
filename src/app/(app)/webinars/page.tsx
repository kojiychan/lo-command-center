import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatWebinarDate, isUpcoming } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/current-user";
import { getWebinarLibrary } from "@/server/queries/webinars";

export default async function WebinarsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const rows = await getWebinarLibrary(user.id);

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
                  <th className="pb-2 pr-4 font-medium">Views</th>
                  <th className="pb-2 pr-4 font-medium">Sign ups</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 pl-4 text-right font-medium">Edit</th>
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
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {w.view_count.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {w.signup_count.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <Badge tone={upcoming ? "success" : "neutral"}>
                          {upcoming ? "Upcoming" : "Past"}
                        </Badge>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <Link
                          href={`/webinars/${w.id}/edit`}
                          aria-label={`Edit ${w.title}`}
                          title={`Edit ${w.title}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Link>
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
