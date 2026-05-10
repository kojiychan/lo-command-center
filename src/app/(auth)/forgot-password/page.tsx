import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
        <p className="text-sm text-slate-600">
          Enter your email and we’ll send a secure link to choose a new password.
        </p>
      </div>

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
