"use client";

import { useEffect, useMemo, useState } from "react";
import { createWebinar } from "@/app/actions/webinars";
import { Button } from "@/components/ui/button";
import { BonzoStageSelector } from "@/components/webinars/bonzo-stage-selector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserTimezone } from "@/hooks/use-user-timezone";
import {
  buildTimezoneOptions,
  localDateTimeInTimeZoneToUtc,
} from "@/lib/timezone-utils";
import { extractMetaPixelId } from "@/lib/meta-pixel";
import { slugify } from "@/lib/slug";
import {
  WEBINAR_TEMPLATE_LIST,
  getWebinarTemplate,
  type WebinarTemplateConfig,
  type WebinarTemplateId,
} from "@/lib/webinarTemplates";

type EditableTemplateFields = {
  title: string;
  description: string;
  headline: string;
  subheadline: string;
  heroBullets: string;
  agendaItems: string;
  urlEnding: string;
};

type NewWebinarFormProps = {
  hostName: string;
};

function templateFields(template: WebinarTemplateConfig): EditableTemplateFields {
  return {
    title: template.recommendedTitle,
    description: template.recommendedDescription,
    headline: template.defaultHeadline,
    subheadline: template.defaultSubheadline,
    heroBullets: template.defaultHeroBullets.join("\n"),
    agendaItems: template.defaultAgenda.join("\n"),
    urlEnding: slugify(template.name),
  };
}

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const minuteOptions = ["00", "15", "30", "45"];
const meridiemOptions = ["AM", "PM"] as const;

function extractMeetingUrl(text: string) {
  const meetUrl = text.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0];
  if (meetUrl) return meetUrl;

  const firstUrl = text.match(/https?:\/\/\S+/i)?.[0];
  return firstUrl?.replace(/[),.;]+$/, "") ?? text;
}

export function NewWebinarForm({ hostName }: NewWebinarFormProps) {
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("06");
  const [startMinute, setStartMinute] = useState("00");
  const [startMeridiem, setStartMeridiem] = useState<(typeof meridiemOptions)[number]>("PM");
  const userTz = useUserTimezone();
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<WebinarTemplateId | null>(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [customized, setCustomized] = useState(false);
  const [fields, setFields] = useState<EditableTemplateFields>({
    title: "",
    description: "",
    headline: "",
    subheadline: "",
    heroBullets: "",
    agendaItems: "",
    urlEnding: "",
  });

  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);

  useEffect(() => {
    if (userTz && timezoneOptions.some((option) => option.value === userTz)) {
      setTimezone(userTz);
    }
  }, [timezoneOptions, userTz]);

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
    if (!startsLocal) return "";
    try {
      const utc = localDateTimeInTimeZoneToUtc(startsLocal, timezone);
      if (Number.isNaN(utc.getTime())) return "";
      return utc.toISOString();
    } catch {
      return "";
    }
  }, [startDate, startHour, startMeridiem, startMinute, timezone]);

  function markCustomized(patch: Partial<EditableTemplateFields>) {
    setCustomized(true);
    setFields((current) => ({ ...current, ...patch }));
  }

  function chooseTemplate(templateId: WebinarTemplateId) {
    if (selectedTemplateId && selectedTemplateId !== templateId && customized) {
      const confirmed = window.confirm(
        "Changing templates will replace the generated landing page copy you have edited. Continue?",
      );
      if (!confirmed) return;
    }

    setSelectedTemplateId(templateId);
    setFields(templateFields(getWebinarTemplate(templateId)));
    setCustomized(false);
  }

  return (
    <form
      className="space-y-6"
      action={async (formData) => {
        setError(null);
        if (!selectedTemplateId) {
          setError("Choose a webinar template before creating the webinar.");
          return;
        }
        if (!startsAtIso) {
          setError("Pick a valid date and time for the webinar.");
          return;
        }
        const template = getWebinarTemplate(selectedTemplateId);
        formData.set("starts_at", startsAtIso);
        formData.set("timezone", timezone);
        formData.set("template_type", selectedTemplateId);
        formData.set("cta_text", template.defaultCTA);
        formData.set("button_text", template.defaultCTA);
        const result = await createWebinar(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="host_name" value={hostName} />
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Choose a Webinar Template</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick a starting point. Generated copy stays editable before you create the webinar.
          </p>
        </div>
        <input type="hidden" name="template_type" value={selectedTemplateId ?? ""} />
        <div className="grid gap-4 lg:grid-cols-3">
          {WEBINAR_TEMPLATE_LIST.map((template) => {
            const selected = selectedTemplateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => chooseTemplate(template.id)}
                className={[
                  "rounded-2xl border bg-white p-4 text-left shadow-sm transition",
                  selected
                    ? "border-emerald-500 ring-4 ring-emerald-500/10"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-slate-900">{template.name}</div>
                <p className="mt-2 text-sm text-slate-600">{template.shortDescription}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Best for
                </div>
                <p className="mt-1 text-xs text-slate-600">{template.targetAudience}</p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Example:</span>{" "}
                  {template.defaultHeadline}
                </div>
              </button>
            );
          })}
        </div>

      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Webinar details</h2>
          <Input
            label="Webinar title *"
            name="title"
            required
            placeholder="First-Time Homebuyer Workshop (DPA + Pre-Approval)"
            value={fields.title}
            onChange={(event) => markCustomized({ title: event.target.value })}
          />
          <Textarea
            label="Description *"
            name="description"
            rows={5}
            required
            placeholder="What they’ll learn, who it’s for, and what to bring (questions welcome)."
            value={fields.description}
            onChange={(event) => markCustomized({ description: event.target.value })}
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
              <span className="text-xs text-slate-500">
                Stored in UTC internally; displayed to registrants in the webinar timezone.
              </span>
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
              <div className="mt-2 text-xs text-slate-500">
                Choose Alaska, HST, PST, MST, CST, or EST.
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Host name
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{hostName}</div>
            <p className="mt-1 text-xs text-slate-500">
              Pulled from onboarding. Update your name in Settings if this needs to change.
            </p>
          </div>
          <Input
            label="Join link *"
            name="join_url"
            type="url"
            required
            placeholder="https://zoom.us/j/… or https://meet.google.com/…"
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
            hint="Shown only after registration in this MVP."
          />
          <Input
            label="Meta Pixel ID"
            name="meta_pixel_id"
            inputMode="numeric"
            pattern="[0-9]{5,30}"
            placeholder="123456789012345"
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
          <BonzoStageSelector />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Landing page</h2>
          <Input
            label="URL ending *"
            name="slug"
            required
            placeholder="first-time-homebuyer"
            value={fields.urlEnding}
            onChange={(event) => markCustomized({ urlEnding: event.target.value })}
            hint="Public URL becomes /w/your-ending. You can edit this before creating the webinar."
          />
          <Input
            label="Headline *"
            name="headline"
            required
            placeholder="Buy your first home with confidence (even if you’re starting at zero down)."
            value={fields.headline}
            onChange={(event) => markCustomized({ headline: event.target.value })}
          />
          <Textarea
            label="Subheadline *"
            name="subheadline"
            rows={3}
            required
            placeholder="Learn how down payment assistance works, what lenders really look at, and the 3 mistakes that delay approvals."
            value={fields.subheadline}
            onChange={(event) => markCustomized({ subheadline: event.target.value })}
          />
          <Textarea
            label="Hero bullet points *"
            name="hero_bullets"
            rows={6}
            required
            hint="One bullet per line."
            value={fields.heroBullets}
            onChange={(event) => markCustomized({ heroBullets: event.target.value })}
          />
          <Textarea
            label="Agenda *"
            name="agenda_items"
            rows={6}
            required
            hint="One agenda item per line."
            value={fields.agendaItems}
            onChange={(event) => markCustomized({ agendaItems: event.target.value })}
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
