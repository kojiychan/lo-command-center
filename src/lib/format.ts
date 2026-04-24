import { format, formatDistanceToNow, isFuture } from "date-fns";

export function formatWebinarDate(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return format(new Date(iso), "EEE, MMM d · h:mm a");
  }
}

export function formatShortDate(iso: string) {
  return format(new Date(iso), "MMM d, yyyy");
}

export function formatRelative(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function isUpcoming(iso: string) {
  return isFuture(new Date(iso));
}
