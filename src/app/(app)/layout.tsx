import { AppShell } from "@/components/layout/app-shell";
import { ensureDefaultReminderTemplates } from "@/app/actions/reminders";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureDefaultReminderTemplates(user.id);
  }

  return <AppShell>{children}</AppShell>;
}
