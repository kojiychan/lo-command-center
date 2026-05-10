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
import {
  WEBINAR_TEMPLATE_LIST,
  getWebinarTemplate,
  type WebinarTemplateConfig,
  type WebinarTemplateId,
} from "@/lib/webinarTemplates";

type EditableTemplateFields = {
  title: string;
  description: string;
  ctaText: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  heroBullets: string;
  agendaItems: string;
};

function templateFields(template: WebinarTemplateConfig): EditableTemplateFields {
  return {
    title: template.recommendedTitle,
    description: template.recommendedDescription,
    ctaText: template.defaultCTA,
    headline: template.defaultHeadline,
    subheadline: template.defaultSubheadline,
    buttonText: template.defaultCTA,
    heroBullets: template.defaultHeroBullets.join("\n"),
    agendaItems: template.defaultAgenda.join("\n"),
  };
}

export function NewWebinarForm({ hostName }: { hostName: string }) {
  const [startsLocal, setStartsLocal] = useState("");
  const userTz = useUserTimezone();
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<WebinarTemplateId | null>(null);
  const [customized, setCustomized] = useState(false);
  const [fields, setFields] = useState<EditableTemplateFields>({
    title: "",
    description: "",
    ctaText: "",
    headline: "",
    subheadline: "",
    buttonText: "",
    heroBullets: "",
    agendaItems: "",
  });

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

  const selectedTemplate = selectedTemplateId ? getWebinarTemplate(selectedTemplateId) : null;

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
        formData.set("starts_at", startsAtIso);
        formData.set("timezone", timezone);
        formData.set("template_type", selectedTemplateId);
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

        {selectedTemplate ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Template preview</div>
            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</div>
                <p className="mt-1 text-sm font-medium text-slate-900">{fields.headline}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero bullets</div>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {fields.heroBullets
                    .split("\n")
                    .filter(Boolean)
                    .slice(0, 5)
                    .map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda</div>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {fields.agendaItems
                    .split("\n")
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Webinar details</h2>
          <Input
            label="Webinar title"
            name="title"
            required
            placeholder="First-Time Homebuyer Workshop (DPA + Pre-Approval)"
            value={fields.title}
            onChange={(event) => markCustomized({ title: event.target.value })}
          />
          <Textarea
            label="Description"
            name="description"
            rows={5}
            placeholder="What they’ll learn, who it’s for, and what to bring (questions welcome)."
            value={fields.description}
            onChange={(event) => markCustomized({ description: event.target.value })}
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
            value={fields.ctaText}
            onChange={(event) => markCustomized({ ctaText: event.target.value })}
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
            value={fields.headline}
            onChange={(event) => markCustomized({ headline: event.target.value })}
          />
          <Textarea
            label="Subheadline"
            name="subheadline"
            rows={3}
            placeholder="Learn how down payment assistance works, what lenders really look at, and the 3 mistakes that delay approvals."
            value={fields.subheadline}
            onChange={(event) => markCustomized({ subheadline: event.target.value })}
          />
          <Textarea
            label="Hero bullet points"
            name="hero_bullets"
            rows={6}
            required
            hint="One bullet per line."
            value={fields.heroBullets}
            onChange={(event) => markCustomized({ heroBullets: event.target.value })}
          />
          <Textarea
            label="Agenda"
            name="agenda_items"
            rows={6}
            required
            hint="One agenda item per line."
            value={fields.agendaItems}
            onChange={(event) => markCustomized({ agendaItems: event.target.value })}
          />
          <Input
            label="Button text"
            name="button_text"
            value={fields.buttonText}
            onChange={(event) => markCustomized({ buttonText: event.target.value })}
            required
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
