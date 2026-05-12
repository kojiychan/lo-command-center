import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const errorMessage =
    searchParams?.error === "expired"
      ? "That reset link is invalid or has expired. Send yourself a new link below."
      : searchParams?.error
        ? "There was a problem with that reset link. Send yourself a new link below."
        : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
        <p className="text-sm text-slate-600">
          Enter your email and we’ll send a secure link to choose a new password.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href="/login">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
