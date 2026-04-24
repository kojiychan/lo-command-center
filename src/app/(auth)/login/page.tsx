import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; next?: string };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-600">
          Sign in to manage your homebuyer webinars, reminders, and follow-up.
        </p>
      </div>

      {searchParams?.error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          There was a problem confirming your email link. Try signing in again.
        </div>
      ) : null}

      <LoginForm nextPath={searchParams?.next} />

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href="/signup">
          Create an account
        </Link>
      </p>
    </div>
  );
}
