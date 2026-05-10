import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
        <p className="text-sm text-slate-600">
          Enter a new password for your LO Command Center account.
        </p>
      </div>

      <ResetPasswordForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already updated?{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
