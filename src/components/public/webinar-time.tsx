"use client";

import { useUserTimezone } from "@/hooks/use-user-timezone";
import { formatInTimeZone } from "@/lib/timezone-utils";

export function WebinarTime({
  startsAtIsoUtc,
  webinarTimeZone,
}: {
  startsAtIsoUtc: string;
  webinarTimeZone: string;
}) {
  const userTz = useUserTimezone();
  const safeUserTz = userTz ?? webinarTimeZone;

  const primary = formatInTimeZone(startsAtIsoUtc, webinarTimeZone);
  const showSecondary = safeUserTz !== webinarTimeZone;
  const secondary = showSecondary ? formatInTimeZone(startsAtIsoUtc, safeUserTz) : null;

  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-slate-900">{primary}</div>
      {secondary ? (
        <div className="text-xs text-slate-600">
          Your time: <span className="font-semibold">{secondary}</span>
        </div>
      ) : null}
    </div>
  );
}

