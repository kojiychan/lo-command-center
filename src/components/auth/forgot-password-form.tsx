"use client";

import { useFormState } from "react-dom";
import {
  requestPasswordReset,
  type PasswordResetState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: PasswordResetState = { error: null, message: null };

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <Input label="Work email" name="email" type="email" autoComplete="email" required />

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
        Send reset link
      </Button>
    </form>
  );
}
