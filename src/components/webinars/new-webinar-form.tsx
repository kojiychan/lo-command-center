"use client";

import { useEffect, useMemo, useState } from "react";
import { createWebinar } from "@/app/actions/webinars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useUserTimezone } from "@/hooks/use-user-timezone";
import {
  buildTimezoneOptions,
  localDateTimeInTimeZoneToUtc,
} from "@/lib/timezone-utils";

export function NewWebinarForm() {
  const [startsLocal, setStartsLocal] = useState("");
  const userTz = useUserTimezone();
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userTz) {
      setTimezone(userTz);
    }
  }, [userTz]);

  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);

  const startsAtIso = useMemo(() => {
    if (!startsLocal) return "";
    try {
      const utc = localDateTimeInTimeZoneToUtc(startsLocal, timezone);
      if (Number.isNaN(utc.getTime())) return "";
      return utc.toISOString();
    } catch {
      return "";
    }
  }, [startsLocal, timezone]);

  return (
    <form
      className="space-y-6"
      action={async (formData) => {
        setError(null);
        if (!startsAtIso) {
          setError("Pick a valid date and time for the webinar.");
          return;
        }
        formData.set("starts_at", startsAtIso);
        formData.set("timezone", timezone);
        const result = await createWebinar(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Webinar details</h2>
          <Input label="Webinar title" name="title" required placeholder="First-Time Homebuyer Workshop (DPA + Pre-Approval)" />
          <Textarea
            label="Description"
            name="description"
            rows={5}
            placeholder="What they’ll learn, who it’s for, and what to bring (questions welcome)."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Date & time</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                type="datetime-local"
                value={startsLocal}
                onChange={(e) => setStartsLocal(e.target.value)}
                required
              />
              <span className="text-xs text-slate-500">
                Stored in UTC internally; displayed to registrants in the webinar timezone.
              </span>
            </label>
            <div>
              <Combobox
                label="Timezone"
                name="timezone"
                options={timezoneOptions}
                defaultValue={timezone}
                onValueChange={(v) => setTimezone(v)}
                required
              />
              <div className="mt-2 text-xs text-slate-500">
                Detected: <span className="font-mono">{userTz ?? "—"}</span>
              </div>
            </div>
          </div>
          <Input label="Host name" name="host_name" required placeholder="Jordan Lee, Loan Officer" />
          <Input
            label="Join link"
            name="join_url"
            type="url"
            required
            placeholder="https://zoom.us/j/… or https://meet.google.com/…"
            hint="Shown only after registration in this MVP."
          />
          <Input
            label="CTA line (optional)"
            name="cta_text"
            placeholder="Free live training · limited seats"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Landing page</h2>
          <Input
            label="URL slug"
            name="slug"
            placeholder="first-time-buyer-april"
            hint="Public URL becomes /w/your-slug (lowercase, dashes)."
          />
          <Input
            label="Headline"
            name="headline"
            required
            placeholder="Buy your first home with confidence (even if you’re starting at zero down)."
          />
          <Textarea
            label="Subheadline"
            name="subheadline"
            rows={3}
            placeholder="Learn how down payment assistance works, what lenders really look at, and the 3 mistakes that delay approvals."
          />
          <Input label="Button text" name="button_text" defaultValue="Save my seat" required />
          <Input
            label="Hero image URL (optional)"
            name="hero_image_url"
            type="url"
            placeholder="https://…"
            hint="Paste an image URL for now. Later: wire Supabase Storage uploads here."
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Create webinar</Button>
        <p className="text-xs text-slate-500">
          We’ll copy your default reminder templates into this webinar so you can tune copy per funnel.
        </p>
      </div>
    </form>
  );
}
