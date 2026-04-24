"use client";

import { useFormState } from "react-dom";
import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { error: string | null; message: string | null };

const initialState: State = { error: null, message: null };

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <Input label="Full name" name="full_name" autoComplete="name" required />
      <Input label="Work email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Use at least 8 characters. You’ll use this to manage registrants and reminders."
      />

      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {state.message}
        </div>
      ) : null}

      <Button className="w-full" type="submit">
        Create account
      </Button>
    </form>
  );
}
