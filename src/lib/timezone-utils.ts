import { fromZonedTime, toZonedTime } from "date-fns-tz";

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
  const zoned = toZonedTime(date, timeZone);
  return Math.round((zoned.getTime() - date.getTime()) / 60000);
}

function formatOffset(offsetMinutes: number) {
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `GMT${sign}${hh}:${mm}`;
}

/**
 * Build a timezone option list using `Intl.supportedValuesOf('timeZone')` when available.
 * Falls back to a small curated list if not supported.
 */
export function buildTimezoneOptions(referenceDate = new Date()): TimezoneOption[] {
  const values =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;

  const base = values?.length
    ? values
    : [
        "America/Los_Angeles",
        "America/Denver",
        "America/Chicago",
        "America/New_York",
        "America/Phoenix",
        "Pacific/Honolulu",
      ];

  const options = base.map((tz) => {
    const offsetMinutes = getOffsetMinutes(tz, referenceDate);
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    const region = tz.startsWith("America/")
      ? "Time"
      : tz.split("/")[0]?.replace(/_/g, " ");
    const label = `(${formatOffset(offsetMinutes)}) ${region} — ${city}`;
    return { value: tz, label, offsetMinutes };
  });

  return options.sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label));
}

