"use client";

import Link from "next/link";
import { useState } from "react";
import { completePresenterSetup } from "@/app/actions/webinars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WEBINAR_BASE_DOMAIN, formatWebinarDomain } from "@/domain/profiles";

type PresenterProfileDraft = {
  companyName: string;
  domainPrefix: string;
  shortBio: string;
  yearsExperience: string;
  familiesHelped: string;
  totalLoanVolume: string;
  specialtyFocus: string;
  licenseStates: string;
  profileImageUrl: string | null;
};

type TestimonialDraft = {
  reviewerName: string;
  reviewerContext: string;
  reviewText: string;
  rating: string;
};

type PresenterSetupFormProps = {
  profile: PresenterProfileDraft;
  testimonials: TestimonialDraft[];
};

const blankTestimonial = (): TestimonialDraft => ({
  reviewerName: "",
  reviewerContext: "",
  reviewText: "",
  rating: "5",
});

const samplePresenterBio =
  "I’m a mortgage advisor who helps buyers understand their options before they start shopping. I specialize in making the loan process feel clear, practical, and less overwhelming, especially for buyers who want a real plan before they make an offer.";

export function PresenterSetupForm({ profile, testimonials }: PresenterSetupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [presenter, setPresenter] = useState(profile);
  const [reviews, setReviews] = useState<TestimonialDraft[]>(
    [0, 1, 2].map((index) => testimonials[index] ?? blankTestimonial()),
  );

  function updateReview(index: number, patch: Partial<TestimonialDraft>) {
    setReviews((current) =>
      current.map((review, reviewIndex) =>
        reviewIndex === index ? { ...review, ...patch } : review,
      ),
    );
  }

  return (
    <form
      className="space-y-6"
      encType="multipart/form-data"
      action={async (formData) => {
        setError(null);
        const result = await completePresenterSetup(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Company"
          name="company_name"
          value={presenter.companyName}
          onChange={(event) => setPresenter({ ...presenter, companyName: event.target.value })}
          placeholder="ARC Mortgage"
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Webinar domain prefix</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              name="domain_prefix"
              value={presenter.domainPrefix}
              onChange={(event) =>
                setPresenter({ ...presenter, domainPrefix: event.target.value.toLowerCase() })
              }
              maxLength={63}
              pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
              placeholder="arcmortgage"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
            <span className="text-sm text-slate-600">.{WEBINAR_BASE_DOMAIN}</span>
          </div>
          <span className="text-xs text-slate-500">
            Preview: {formatWebinarDomain(presenter.domainPrefix)}
          </span>
        </label>
        <Textarea
          label="Presenter bio"
          name="short_bio"
          rows={5}
          value={presenter.shortBio}
          onChange={(event) => setPresenter({ ...presenter, shortBio: event.target.value })}
          placeholder={samplePresenterBio}
          hint="Optional. This appears in the Meet Your Presenter section."
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            {presenter.profileImageUrl ? "Replace profile image" : "Upload profile image"}
          </span>
          <input
            name="profile_image_file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30"
          />
          <span className="text-xs text-slate-500">Optional. JPG, PNG, WebP, or GIF up to 5MB.</span>
          {presenter.profileImageUrl ? (
            <span className="block text-xs text-slate-500">A profile image is already saved.</span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Input
          label="Years experience"
          name="years_experience"
          inputMode="numeric"
          value={presenter.yearsExperience}
          onChange={(event) => setPresenter({ ...presenter, yearsExperience: event.target.value })}
        />
        <Input
          label="Families helped"
          name="families_helped"
          inputMode="numeric"
          value={presenter.familiesHelped}
          onChange={(event) => setPresenter({ ...presenter, familiesHelped: event.target.value })}
        />
        <Input
          label="Loan volume"
          name="total_loan_volume"
          value={presenter.totalLoanVolume}
          onChange={(event) => setPresenter({ ...presenter, totalLoanVolume: event.target.value })}
          placeholder="$100M+"
        />
        <Input
          label="Specialty"
          name="specialty_focus"
          value={presenter.specialtyFocus}
          onChange={(event) => setPresenter({ ...presenter, specialtyFocus: event.target.value })}
          placeholder="First-time buyers"
        />
        <div className="lg:col-span-4">
          <Input
            label="License states"
            name="license_states"
            value={presenter.licenseStates}
            onChange={(event) => setPresenter({ ...presenter, licenseStates: event.target.value })}
            placeholder="CA, AZ, NV"
            hint="Optional credibility detail only. Webinar location/program details still live on each webinar."
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Client reviews</h3>
          <p className="mt-1 text-xs text-slate-500">
            Optional. Fill in any reviews you want shown on the landing page, or leave them blank for now.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {reviews.map((review, index) => {
            const number = index + 1;
            return (
              <div key={number} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-sm font-semibold text-slate-900">Review {number}</div>
                <Input
                  label="Reviewer name"
                  name={`reviewer_name_${number}`}
                  value={review.reviewerName}
                  onChange={(event) => updateReview(index, { reviewerName: event.target.value })}
                />
                <Input
                  label="Reviewer context"
                  name={`reviewer_context_${number}`}
                  value={review.reviewerContext}
                  onChange={(event) => updateReview(index, { reviewerContext: event.target.value })}
                  placeholder="First-time buyer"
                />
                <Textarea
                  label="Review text"
                  name={`review_text_${number}`}
                  rows={4}
                  value={review.reviewText}
                  onChange={(event) => updateReview(index, { reviewText: event.target.value })}
                  hint="Minimum 20 characters if filled."
                />
                <Input
                  label="Rating"
                  name={`rating_${number}`}
                  type="number"
                  min="1"
                  max="5"
                  value={review.rating}
                  onChange={(event) => updateReview(index, { rating: event.target.value })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/webinars/new?setup=done" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Skip for now
        </Link>
        <Button type="submit">Save and create webinar</Button>
      </div>
    </form>
  );
}
