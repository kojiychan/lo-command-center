"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  targetDate: string | Date;
  variant?: "hero" | "inline";
};

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function format2(n: number) {
  return String(n).padStart(2, "0");
}

type CountdownState =
  | { status: "counting"; parts: Parts }
  | { status: "live" }
  | { status: "past" };

function useCountdown(targetDate: string | Date): CountdownState {
  const target = useMemo(() => {
    const d = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    return d.getTime();
  }, [targetDate]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!Number.isFinite(target)) {
    return { status: "past" };
  }

  const diff = target - now;

  // "Live" window: within 2 hours after start time.
  if (diff <= 0 && diff > -2 * 60 * 60 * 1000) {
    return { status: "live" };
  }

  if (diff <= 0) {
    return { status: "past" };
  }

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { status: "counting", parts: { days, hours, minutes, seconds } };
}

export function CountdownTimer({ targetDate, variant = "hero" }: Props) {
  const state = useCountdown(targetDate);

  if (state.status === "past") {
    // Past state: keep the hero clean (future: replace with "Replay available" logic).
    return null;
  }

  const isHero = variant === "hero";

  if (state.status === "live") {
    return (
      <div
        className={`rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm ${
          isHero ? "shadow-emerald-900/5" : ""
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          We’re live now
        </div>
        <div className="mt-1 text-base font-semibold text-slate-900">
          Join below to get the link.
        </div>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = state.parts;

  return (
    <div
      className={[
        "rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm",
        "shadow-emerald-900/5",
        // Subtle pulse every few seconds (premium, not spammy).
        "animate-[pulse_6s_ease-in-out_infinite]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900">
            ⏳ Webinar starts in
          </div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Secure your seat before it starts
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TimeBox label="Days" value={String(days)} emphasize={isHero} />
          <TimeBox label="Hours" value={format2(hours)} emphasize={isHero} />
          <TimeBox label="Min" value={format2(minutes)} emphasize={isHero} />
          <TimeBox label="Sec" value={format2(seconds)} emphasize={isHero} />
        </div>
      </div>
    </div>
  );
}

function TimeBox({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize: boolean;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-4 text-center shadow-sm">
      <div
        className={[
          "font-semibold tabular-nums",
          "text-emerald-700",
          emphasize ? "text-4xl sm:text-5xl" : "text-3xl",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

