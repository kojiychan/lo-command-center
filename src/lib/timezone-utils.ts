import { fromZonedTime, getTimezoneOffset } from "date-fns-tz";

export type TimezoneOption = {
  value: string;
  label: string;
  offsetMinutes: number;
};

export function getUserTimezoneFallback(webinarTimezone: string) {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || webinarTimezone;
  } catch {
    return webinarTimezone;
  }
}

/** Convert a wall-clock datetime (YYYY-MM-DDTHH:mm) in `timeZone` → UTC Date. */
export function localDateTimeInTimeZoneToUtc(
  localDateTime: string,
  timeZone: string,
) {
  // `fromZonedTime` interprets the provided date/time as being in `timeZone`.
  // It returns a Date representing the same instant in UTC.
  return fromZonedTime(localDateTime, timeZone);
}

/** Format an ISO string in a specific timezone (short weekday, etc). */
export function formatInTimeZone(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone,
  }).format(new Date(iso));
}

/** Returns offset minutes for `timeZone` at `date` (handles DST). */
export function getOffsetMinutes(timeZone: string, date = new Date()) {
  return Math.round(getTimezoneOffset(timeZone, date) / 60000);
}

function formatOffset(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `GMT${sign}${hh}:${mm}`;
}

const US_WEBINAR_TIMEZONES: Array<{ value: string; labelPrefix: string }> = [
  { value: "America/Anchorage", labelPrefix: "Alaska" },
  { value: "Pacific/Honolulu", labelPrefix: "HST" },
  { value: "America/Los_Angeles", labelPrefix: "PST" },
  { value: "America/Denver", labelPrefix: "MST" },
  { value: "America/Chicago", labelPrefix: "CST" },
  { value: "America/New_York", labelPrefix: "EST" },
];

/**
 * Keep webinar creation to the US timezones the product supports.
 */
export function buildTimezoneOptions(referenceDate = new Date()): TimezoneOption[] {
  const options = US_WEBINAR_TIMEZONES.map((tz) => {
    const offsetMinutes = getOffsetMinutes(tz.value, referenceDate);
    const city = tz.value.split("/").pop()?.replace(/_/g, " ") ?? tz.value;
    const label = `${tz.labelPrefix} (${formatOffset(offsetMinutes)}) — ${city}`;
    return { value: tz.value, label, offsetMinutes };
  });

  return options.sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label));
}
