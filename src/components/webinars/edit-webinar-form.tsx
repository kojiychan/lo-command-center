"use client";

import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo, useState } from "react";
import { updateWebinarDetails } from "@/app/actions/webinars";
import { BonzoStageSelector } from "@/components/webinars/bonzo-stage-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildTimezoneOptions,
  localDateTimeInTimeZoneToUtc,
} from "@/lib/timezone-utils";
import { extractMetaPixelId } from "@/lib/meta-pixel";
import type { Webinar, WebinarPage } from "@/types/database";

type EditWebinarFormProps = {
  webinar: Webinar;
  page: WebinarPage;
};

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const minuteOptions = ["00", "15", "30", "45"];
const meridiemOptions = ["AM", "PM"] as const;

function extractMeetingUrl(text: string) {
  const meetUrl = text.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0];
  if (meetUrl) return meetUrl;

  const firstUrl = text.match(/https?:\/\/\S+/i)?.[0];
  return firstUrl?.replace(/[),.;]+$/, "") ?? text;
}

function initialTimeParts(startsAt: string, timezone: string) {
  const hour24 = Number(formatInTimeZone(startsAt, timezone, "HH"));
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = formatInTimeZone(startsAt, timezone, "mm");

  return {
    date: formatInTimeZone(startsAt, timezone, "yyyy-MM-dd"),
    hour: String(hour12).padStart(2, "0"),
    minute: minuteOptions.includes(minute) ? minute : "00",
    meridiem: (hour24 >= 12 ? "PM" : "AM") as (typeof meridiemOptions)[number],
  };
}

export function EditWebinarForm({ webinar, page }: EditWebinarFormProps) {
  const timezoneOptions = useMemo(() => buildTimezoneOptions(new Date(webinar.starts_at)), [webinar.starts_at]);
  const initial = initialTimeParts(webinar.starts_at, webinar.timezone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [startDate, setStartDate] = useState(initial.date);
  const [startHour, setStartHour] = useState(initial.hour);
  const [startMinute, setStartMinute] = useState(initial.minute);
  const [startMeridiem, setStartMeridiem] = useState<(typeof meridiemOptions)[number]>(
    initial.meridiem,
  );
  const [timezone, setTimezone] = useState(webinar.timezone);
  const [joinUrl, setJoinUrl] = useState(webinar.join_url);

  const startsAtIso = useMemo(() => {
    if (!startDate) return "";
    const hour12 = Number(startHour);
    const hour24 =
      startMeridiem === "PM"
        ? hour12 === 12
          ? 12
          : hour12 + 12
        : hour12 === 12
          ? 0
          : hour12;
    const startsLocal = `${startDate}T${String(hour24).padStart(2, "0")}:${startMinute}`;

    try {
      const utc = localDateTimeInTimeZoneToUtc(startsLocal, timezone);
      if (Number.isNaN(utc.getTime())) return "";
      return utc.toISOString();
    } catch {
      return "";
    }
  }, [startDate, startHour, startMeridiem, startMinute, timezone]);

  return (
    <form
      className="space-y-6"
      action={async (formData) => {
        setError(null);
        setSaved(false);
        if (!startsAtIso) {
          setError("Pick a valid date and time for the webinar.");
          return;
        }

        formData.set("webinar_id", webinar.id);
        formData.set("starts_at", startsAtIso);
        formData.set("timezone", timezone);
        formData.set("join_url", joinUrl);
        formData.set("cta_text", webinar.cta_text ?? page.button_text);
        formData.set("button_text", page.button_text);

        const result = await updateWebinarDetails(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSaved(true);
      }}
    >
      <input type="hidden" name="webinar_id" value={webinar.id} />
      <input type="hidden" name="cta_text" value={webinar.cta_text ?? page.button_text} />
      <input type="hidden" name="button_text" value={page.button_text} />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          URL ending
        </div>
        <div className="mt-1 font-mono text-sm font-semibold text-slate-900">/w/{page.slug}</div>
        <p className="mt-1 text-xs text-slate-500">
          This stays locked so existing ads, links, registrations, and tracking keep working.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Webinar details</h2>
          <Input
            label="Webinar title *"
            name="title"
            required
            defaultValue={webinar.title}
          />
          <Textarea
            label="Description *"
            name="description"
            rows={5}
            required
            defaultValue={webinar.description ?? ""}
          />
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Date & time *</span>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2">
                <input
                  className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  aria-label="Webinar date"
                />
                <select
                  value={startHour}
                  onChange={(event) => setStartHour(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  aria-label="Webinar hour"
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <select
                  value={startMinute}
                  onChange={(event) => setStartMinute(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  aria-label="Webinar minute"
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
                <select
                  value={startMeridiem}
                  onChange={(event) =>
                    setStartMeridiem(event.target.value as (typeof meridiemOptions)[number])
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  aria-label="Webinar AM or PM"
                >
                  {meridiemOptions.map((meridiem) => (
                    <option key={meridiem} value={meridiem}>
                      {meridiem}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="timezone">
                Timezone *
              </label>
              <div className="relative">
                <select
                  id="timezone"
                  name="timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  required
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  ▾
                </span>
              </div>
            </div>
          </div>
          <Input
            label="Join link *"
            name="join_url"
            type="url"
            required
            value={joinUrl}
            onChange={(event) => setJoinUrl(event.target.value)}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              const extracted = extractMeetingUrl(pasted);
              if (extracted !== pasted) {
                event.preventDefault();
                setJoinUrl(extracted);
              }
            }}
            hint="Shown only after registration."
          />
          <Input
            label="Meta Pixel ID"
            name="meta_pixel_id"
            inputMode="numeric"
            pattern="[0-9]{5,30}"
            placeholder="123456789012345"
            defaultValue={page.meta_pixel_id ?? ""}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              const extracted = extractMetaPixelId(pasted);
              if (extracted !== pasted) {
                event.preventDefault();
                event.currentTarget.value = extracted;
              }
            }}
            onBlur={(event) => {
              event.currentTarget.value = extractMetaPixelId(event.currentTarget.value);
            }}
            hint="Optional. Tracks landing page views and webinar registrations for Meta ads."
          />
          <BonzoStageSelector
            initialSelection={{
              pipelineId: webinar.bonzo_pipeline_id,
              pipelineName: webinar.bonzo_pipeline_name,
              stageId: webinar.bonzo_stage_id,
              stageName: webinar.bonzo_stage_name,
            }}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Landing page</h2>
          <Input
            label="Headline *"
            name="headline"
            required
            defaultValue={page.headline}
          />
          <Textarea
            label="Subheadline *"
            name="subheadline"
            rows={3}
            required
            defaultValue={page.subheadline ?? ""}
          />
          <Textarea
            label="Hero bullet points *"
            name="hero_bullets"
            rows={6}
            required
            hint="One bullet per line."
            defaultValue={page.hero_bullets.join("\n")}
          />
          <Textarea
            label="Agenda *"
            name="agenda_items"
            rows={6}
            required
            hint="One agenda item per line."
            defaultValue={page.agenda_items.join("\n")}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Webinar saved.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Save changes</Button>
        <Link
          href="/webinars"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to webinars
        </Link>
      </div>
    </form>
  );
}
