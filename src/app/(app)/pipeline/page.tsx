import { PipelineBoard } from "@/components/webinars/pipeline-board";
import { getCurrentUser } from "@/server/auth/current-user";
import { getPipelineLeads } from "@/server/queries/pipeline";

export default async function PipelinePage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const leads = await getPipelineLeads(user.id);

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1600px] -translate-x-1/2 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-600">
          Move prospects from webinar registration through attendance, follow-up, and booked calls.
        </p>
      </div>

      <PipelineBoard leads={leads} />
    </div>
  );
}
