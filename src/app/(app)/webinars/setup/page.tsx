import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { PresenterSetupForm } from "@/components/webinars/presenter-setup-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function WebinarPresenterSetupPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, domain_prefix, short_bio, years_experience, families_helped, total_loan_volume, specialty_focus, license_states, profile_image_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("reviewer_name, reviewer_context, review_text, rating, display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true })
    .limit(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Presenter setup</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add the credibility details reused across your webinar landing pages.
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
          title="Landing page credibility"
          subtitle="This is your second onboarding step before creating your first webinar. You can edit these later in Settings."
        />
        <PresenterSetupForm
          profile={{
            companyName: profile?.company_name ?? "",
            domainPrefix: profile?.domain_prefix ?? "",
            shortBio: profile?.short_bio ?? "",
            yearsExperience: profile?.years_experience == null ? "" : String(profile.years_experience),
            familiesHelped: profile?.families_helped == null ? "" : String(profile.families_helped),
            totalLoanVolume: profile?.total_loan_volume ?? "",
            specialtyFocus: profile?.specialty_focus ?? "",
            licenseStates: profile?.license_states ?? "",
            profileImageUrl: profile?.profile_image_url ?? null,
          }}
          testimonials={[0, 1, 2].map((index) => {
            const review = testimonials?.find((item) => item.display_order === index + 1);
            return {
              reviewerName: review?.reviewer_name ?? "",
              reviewerContext: review?.reviewer_context ?? "",
              reviewText: review?.review_text ?? "",
              rating: review?.rating == null ? "5" : String(review.rating),
            };
          })}
        />
      </Card>
    </div>
  );
}
