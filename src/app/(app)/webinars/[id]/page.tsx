import { WebinarWorkspace } from "@/components/webinars/webinar-workspace";
import { getCurrentUser } from "@/server/auth/current-user";
import { getWebinarWorkspaceData } from "@/server/queries/webinars";

export default async function WebinarDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const data = await getWebinarWorkspaceData(user.id, params.id);

  return (
    <WebinarWorkspace
      webinar={data.webinar}
      page={data.page}
      leads={data.leads}
      templates={data.templates}
      reminderEvents={data.reminderEvents}
    />
  );
}
