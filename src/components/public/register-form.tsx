"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registerForWebinar, type RegisterState } from "@/app/actions/register";
import {
  trackMetaCompleteRegistration,
  trackMetaRegistrationAttempt,
} from "@/components/analytics/meta-pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserTimezone } from "@/hooks/use-user-timezone";

const initialState: RegisterState = { status: "idle" };
const defaultWebinarDurationMinutes = 60;

function calendarDate(value: Date) {
  return value.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function calendarLinks({
  title,
  startsAt,
  joinUrl,
}: {
  title: string;
  startsAt: string;
  joinUrl: string;
}) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + defaultWebinarDurationMinutes * 60 * 1000);
  const details = `Join link: ${joinUrl}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedDetails = encodeURIComponent(details);
  const encodedJoinUrl = encodeURIComponent(joinUrl);
  const dates = `${calendarDate(start)}/${calendarDate(end)}`;

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${dates}&details=${encodedDetails}&location=${encodedJoinUrl}`,
    outlook: `https://outlook.live.com/calendar/0/action/compose?path=/calendar/action/compose&rru=addevent&subject=${encodedTitle}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${encodedDetails}&location=${encodedJoinUrl}`,
  };
}

function Submit({
  label,
  metaPixelId,
  webinarTitle,
}: {
  label: string;
  metaPixelId: string | null;
  webinarTitle: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      className="w-full"
      type="submit"
      disabled={pending}
      data-meta-event="WebinarRegistrationSubmit"
      onClick={() => trackMetaRegistrationAttempt(metaPixelId, webinarTitle)}
    >
      {pending ? "Reserving…" : label}
    </Button>
  );
}

export function RegisterForm({
  slug,
  ctaLabel,
  metaPixelId,
  webinarTitle,
}: {
  slug: string;
  ctaLabel: string;
  metaPixelId: string | null;
  webinarTitle: string;
}) {
  const [state, formAction] = useFormState(registerForWebinar, initialState);
  const userTz = useUserTimezone();
  const trackedLeadId = useRef<string | null>(null);

  useEffect(() => {
    if (state.status !== "success" || trackedLeadId.current === state.leadId) {
      return;
    }

    trackedLeadId.current = state.leadId;
    trackMetaCompleteRegistration(metaPixelId, state.leadId, state.webinarTitle);
  }, [metaPixelId, state]);

  if (state.status === "success") {
    const links = calendarLinks({
      title: state.webinarTitle,
      startsAt: state.startsAt,
      joinUrl: state.joinUrl,
    });

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
        <div className="text-base font-semibold text-slate-900">
          You’re registered
        </div>
        <p className="mt-2 text-sm text-slate-700">
          You’ll get short reminders leading up to start time. Add it to your
          calendar now so the join link is saved.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            href={links.google}
            target="_blank"
            rel="noreferrer"
          >
            Add to Google
          </a>
          <a
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            href={links.outlook}
            target="_blank"
            rel="noreferrer"
          >
            Add to Outlook
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Your calendar event includes this join URL:{" "}
          <span className="break-all font-mono text-slate-700">
            {state.joinUrl}
          </span>
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      {userTz ? <input type="hidden" name="user_tz" value={userTz} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="First name"
          name="first_name"
          autoComplete="given-name"
          required
        />
        <Input
          label="Last name"
          name="last_name"
          autoComplete="family-name"
          required
        />
      </div>
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Mobile phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        hint="We’ll text 1–2 reminders so you don’t miss the start time."
      />

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <Submit label={ctaLabel} metaPixelId={metaPixelId} webinarTitle={webinarTitle} />
      <div className="text-xs text-slate-600">
        <span className="font-semibold text-slate-900">Free to attend.</span>{" "}
        We’ll send reminders and a join link after you register.
      </div>
    </form>
  );
}
