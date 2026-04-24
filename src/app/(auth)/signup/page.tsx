import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-600">
          Built for loan officers running first-time homebuyer and down payment assistance webinars.
        </p>
      </div>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
