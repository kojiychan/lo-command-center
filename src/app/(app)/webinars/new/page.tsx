import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { NewWebinarForm } from "@/components/webinars/new-webinar-form";

export default function NewWebinarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">New webinar</h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep it simple: strong promise, clear time, and a frictionless registration form.
          </p>
        </div>
        <Link
          href="/webinars"
          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back
        </Link>
      </div>

      <Card>
        <CardHeader
          title="Webinar + landing page"
          subtitle="You can iterate copy later — launch beats perfect."
        />
        <NewWebinarForm />
      </Card>
    </div>
  );
}
