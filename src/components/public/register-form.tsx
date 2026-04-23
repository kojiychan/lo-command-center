"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registerForWebinar, type RegisterState } from "@/app/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterState = { status: "idle" };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Reserving…" : label}
    </Button>
  );
}

export function RegisterForm({
  slug,
  ctaLabel,
}: {
  slug: string;
  ctaLabel: string;
}) {
  const [state, formAction] = useFormState(registerForWebinar, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
        <div className="text-base font-semibold text-slate-900">
          You’re registered
        </div>
        <p className="mt-2 text-sm text-slate-700">
          You’ll get short reminders leading up to start time. Save the join link
          now.
        </p>
        <a
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          href={state.joinUrl}
          target="_blank"
          rel="noreferrer"
        >
          Join the webinar
        </a>
        <p className="mt-3 text-xs text-slate-600">
          If the button doesn’t work, copy/paste this URL into your browser:{" "}
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

      <Submit label={ctaLabel} />
      <div className="text-xs text-slate-600">
        <span className="font-semibold text-slate-900">Free to attend.</span>{" "}
        We’ll send reminders and a join link after you register.
      </div>
    </form>
  );
}
