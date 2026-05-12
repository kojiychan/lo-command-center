"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { checkSignupEmail, signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { error: string | null; message: string | null };

const initialState: State = { error: null, message: null };

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [email, setEmail] = useState("");

  async function checkEmailAvailability(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setCheckingEmail(true);
    const result = await checkSignupEmail(trimmed);
    setCheckingEmail(false);
    setClientError(result.ok ? null : result.error);
  }

  return (
    <form className="space-y-5" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          name="first_name"
          autoComplete="given-name"
          required
          onChange={() => setClientError(null)}
        />
        <Input
          label="Last name"
          name="last_name"
          autoComplete="family-name"
          required
          onChange={() => setClientError(null)}
        />
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setClientError(null);
          setEmail(event.target.value);
        }}
        onBlur={(event) => void checkEmailAvailability(event.target.value)}
        required
        hint={checkingEmail ? "Checking email availability..." : undefined}
      />

      <Input
        label="Phone number"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        placeholder="(555) 555-1212"
        onChange={() => setClientError(null)}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Use at least 8 characters."
        onChange={() => setClientError(null)}
      />

      {clientError ?? state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {clientError ?? state.error}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </div>
      ) : null}

      <Button className="w-full" type="submit" disabled={checkingEmail || Boolean(clientError)}>
        Create account
      </Button>
    </form>
  );
}
