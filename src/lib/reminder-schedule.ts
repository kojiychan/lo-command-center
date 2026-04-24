import { addHours, addMinutes, setHours, setMinutes, setSeconds, subHours, subMinutes, subDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { ReminderTemplateKey } from "@/types/database";

export type ScheduledReminder = {
  template_key: ReminderTemplateKey;
  scheduled_for: Date;
};

/**
 * Computes a pragmatic default cadence for MVP rows in `reminder_events`.
 *
 * Rules:
 * - All scheduling is computed in the webinar timezone, then converted to UTC.
 * - day_before = exactly 24 hours before start (skip if within 24 hours).
 * - morning_of = 9:00 AM local webinar time.
 *
 * Integration note: a real scheduler should also respect quiet hours / TCPA rules for SMS.
 */
export function buildDefaultReminderSchedule(
  startsAtIsoUtc: string,
  webinarTimeZone: string,
): ScheduledReminder[] {
  const startUtc = new Date(startsAtIsoUtc);
  const nowUtc = new Date();

  const startLocal = toZonedTime(startUtc, webinarTimeZone);
  const morningLocal = setSeconds(setMinutes(setHours(startLocal, 9), 0), 0);
  const morningUtc = fromZonedTime(morningLocal, webinarTimeZone);

  const schedule: ScheduledReminder[] = [{ template_key: "confirmation", scheduled_for: nowUtc }];

  // day_before = exactly 24 hours before start
  const dayBeforeUtc = subDays(startUtc, 1);
  if (dayBeforeUtc.getTime() - nowUtc.getTime() > 0) {
    schedule.push({ template_key: "day_before", scheduled_for: dayBeforeUtc });
  }

  // morning_of (9am local webinar time). If webinar is before 9am, morning_of could be after start — skip it then.
  if (morningUtc.getTime() < startUtc.getTime() && morningUtc.getTime() - nowUtc.getTime() > 0) {
    schedule.push({ template_key: "morning_of", scheduled_for: morningUtc });
  }

  schedule.push({ template_key: "one_hour", scheduled_for: subHours(startUtc, 1) });
  schedule.push({ template_key: "ten_min", scheduled_for: subMinutes(startUtc, 10) });
  schedule.push({ template_key: "started", scheduled_for: startUtc });
  schedule.push({
    template_key: "post_followup",
    scheduled_for: addMinutes(addHours(startUtc, 1), 5),
  });

  return schedule;
}
