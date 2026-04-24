"use client";

import { useFormState } from "react-dom";
import { signInWithPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { error: string | null };

const initialState: State = { error: null };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useFormState(signInWithPassword, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <Input label="Work email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      <Button className="w-full" type="submit">
        Sign in
      </Button>
    </form>
  );
}
