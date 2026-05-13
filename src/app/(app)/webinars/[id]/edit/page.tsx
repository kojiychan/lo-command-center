import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { EditWebinarForm } from "@/components/webinars/edit-webinar-form";
import { getCurrentUser } from "@/server/auth/current-user";
import { getWebinarWorkspaceData } from "@/server/queries/webinars";

export default async function EditWebinarPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const data = await getWebinarWorkspaceData(user.id, params.id);
  if (!data.webinar || !data.page) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Edit webinar
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Update the webinar details and landing page copy without changing the URL ending.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Webinar + landing page"
          subtitle="Registrations, views, reminders, and lead history stay attached to this webinar."
        />
        <EditWebinarForm webinar={data.webinar} page={data.page} />
      </Card>
    </div>
  );
}
