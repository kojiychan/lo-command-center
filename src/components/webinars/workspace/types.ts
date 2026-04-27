import type {
  Lead,
  ReminderEvent,
  ReminderTemplate,
  Webinar,
  WebinarPage,
} from "@/types/database";

export type WorkspaceTab = "overview" | "leads" | "reminders" | "followup";

export type WebinarWorkspaceProps = {
  webinar: Webinar;
  page: WebinarPage;
  leads: Lead[];
  templates: ReminderTemplate[];
  reminderEvents: ReminderEvent[];
};

export type OverviewStats = {
  total: number;
  attended: number;
  booked: number;
  noShow: number;
};
