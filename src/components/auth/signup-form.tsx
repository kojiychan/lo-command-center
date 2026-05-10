"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { useFormState } from "react-dom";
import { checkSignupEmail, signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WEBINAR_BASE_DOMAIN, formatWebinarDomain } from "@/domain/profiles";

type State = { error: string | null; message: string | null };

type ReviewDraft = {
  reviewerName: string;
  reviewerContext: string;
  reviewText: string;
  rating: string;
};

const initialState: State = { error: null, message: null };

const blankReview = (): ReviewDraft => ({
  reviewerName: "",
  reviewerContext: "",
  reviewText: "",
  rating: "5",
});

const samplePresenterBio =
  "I’m a mortgage advisor who helps buyers understand their options before they start shopping. I specialize in making the loan process feel clear, practical, and less overwhelming, especially for buyers who want a real plan before they make an offer.";

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, initialState);
  const [step, setStep] = useState(0);
  const [clientError, setClientError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    domainPrefix: "",
    email: "",
    password: "",
    shortBio: "",
    profileImagePreviewUrl: "",
    profileImageName: "",
    yearsExperience: "",
    familiesHelped: "",
    totalLoanVolume: "",
    specialtyFocus: "",
    licenseStates: "",
    reviews: [blankReview(), blankReview(), blankReview()],
  });

  const steps = useMemo(
    () => [
      "Bio",
      "Highlights",
      "Review 1",
      "Review 2",
      "Review 3",
    ],
    [],
  );

  useEffect(() => {
    return () => {
      if (form.profileImagePreviewUrl) {
        URL.revokeObjectURL(form.profileImagePreviewUrl);
      }
    };
  }, [form.profileImagePreviewUrl]);

  function updateReview(index: number, patch: Partial<ReviewDraft>) {
    setClientError(null);
    setForm((current) => ({
      ...current,
      reviews: current.reviews.map((review, idx) =>
        idx === index ? { ...review, ...patch } : review,
      ),
    }));
  }

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(form.domainPrefix.trim().toLowerCase())) {
        return "Add a domain prefix using letters, numbers, or hyphens.";
      }
      if (!form.email.trim()) return "Work email is required.";
      if (form.password.length < 8) return "Use a password with at least 8 characters.";
    }

    if (currentStep >= 2) {
      const review = form.reviews[currentStep - 2];
      const hasAnyReviewInput =
        review.reviewerName.trim().length > 0 ||
        review.reviewText.trim().length > 0 ||
        review.reviewerContext.trim().length > 0;
      if (!hasAnyReviewInput) return null;
      if (!review.reviewerName.trim()) {
        return `Review ${currentStep - 1} needs a reviewer name. You can hit Skip review and add it later in Settings.`;
      }
      if (review.reviewText.trim().length < 20) {
        return `Review ${currentStep - 1} needs at least 20 characters of review text. You can hit Skip review and add it later in Settings.`;
      }
    }

    return null;
  }

  async function goNext() {
    const error = validateStep(step);
    if (error) {
      setClientError(error);
      return;
    }

    if (step === 0) {
      setCheckingEmail(true);
      const result = await checkSignupEmail(form.email);
      setCheckingEmail(false);
      if (!result.ok) {
        setClientError(result.error);
        return;
      }
    }

    setClientError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function skipCurrentReview() {
    const reviewIndex = step - 2;
    if (reviewIndex < 0) return;

    setClientError(null);
    updateReview(reviewIndex, blankReview());
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function skipAndSubmitCurrentReview(event: MouseEvent<HTMLButtonElement>) {
    const formElement = event.currentTarget.form;
    const reviewIndex = step - 2;
    if (reviewIndex >= 0) {
      updateReview(reviewIndex, blankReview());
    }
    setClientError(null);
    window.setTimeout(() => formElement?.requestSubmit(), 0);
  }

  return (
    <form className="space-y-6" action={formAction}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Step {step + 1} of {steps.length}
        </div>
        <div className="text-xs font-medium text-slate-500">{steps[step]}</div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className={step === 0 ? "space-y-4" : "hidden"}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tell buyers why they can trust you</h2>
            <p className="mt-1 text-sm text-slate-600">
              This bio will appear on your webinar landing pages.
            </p>
          </div>
          <Input
            label="Full name"
            autoComplete="name"
            value={form.fullName}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, fullName: event.target.value });
            }}
            required
          />
          <Input
            label="Webinar domain prefix"
            value={form.domainPrefix}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, domainPrefix: event.target.value.toLowerCase() });
            }}
            required
            placeholder="arcmortgage"
            hint={`Your webinar domain will be ${formatWebinarDomain(form.domainPrefix || "arcmortgage")}.`}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Enter only the text before <span className="font-semibold text-slate-900">.{WEBINAR_BASE_DOMAIN}</span>.
          </div>
          <Input
            label="Work email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, email: event.target.value });
            }}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, password: event.target.value });
            }}
            required
            hint="Use at least 8 characters. You’ll use this to manage registrants and reminders."
          />
          <Textarea
            label="Presenter bio (optional)"
            value={form.shortBio}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, shortBio: event.target.value });
            }}
            placeholder={samplePresenterBio}
            hint="Optional. Use the sample as a guide: 2–4 sentences about who you help and why buyers should trust you."
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Presenter headshot/profile image</span>
            <input
              name="profile_image_file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setForm((current) => {
                  if (current.profileImagePreviewUrl) {
                    URL.revokeObjectURL(current.profileImagePreviewUrl);
                  }
                  return {
                    ...current,
                    profileImageName: file?.name ?? "",
                    profileImagePreviewUrl: file ? URL.createObjectURL(file) : "",
                  };
                });
              }}
            />
            <span className="text-xs text-slate-500">
              Optional. Upload a JPG, PNG, WebP, or GIF up to 5MB.
            </span>
          </label>
          {form.profileImagePreviewUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.profileImagePreviewUrl}
                alt=""
                className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {form.profileImageName}
                </div>
                <div className="text-xs text-slate-500">This image will appear on webinar landing pages.</div>
              </div>
            </div>
          ) : null}
        </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add credibility highlights</h2>
            <p className="mt-1 text-sm text-slate-600">
              These are optional. Skip anything you do not want displayed globally.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Years experience"
              type="number"
              min={0}
              value={form.yearsExperience}
              onChange={(event) => {
                setClientError(null);
                setForm({ ...form, yearsExperience: event.target.value });
              }}
            />
            <Input
              label="Families helped"
              type="number"
              min={0}
              value={form.familiesHelped}
              onChange={(event) => {
                setClientError(null);
                setForm({ ...form, familiesHelped: event.target.value });
              }}
            />
          </div>
          <Input
            label="Total loan volume"
            value={form.totalLoanVolume}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, totalLoanVolume: event.target.value });
            }}
            placeholder="$75M+"
          />
          <Input
            label="Specialty focus"
            value={form.specialtyFocus}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, specialtyFocus: event.target.value });
            }}
            placeholder="First-time buyers, FHA, down payment assistance"
          />
          <Input
            label="License states"
            value={form.licenseStates}
            onChange={(event) => {
              setClientError(null);
              setForm({ ...form, licenseStates: event.target.value });
            }}
            hint="Optional presenter credential only. Webinar state/location is set per webinar."
            placeholder="CA, AZ"
          />
        </div>
      ) : null}

      {step >= 2 ? (
        <ReviewStep
          reviewNumber={step - 1}
          review={form.reviews[step - 2]}
          onChange={(patch) => updateReview(step - 2, patch)}
        />
      ) : null}

      <HiddenSignupFields form={form} />

      {clientError || state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {clientError ?? state.error}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {state.message}
        </div>
      ) : null}

      <div className={step >= 2 ? "grid gap-3 sm:grid-cols-3" : "flex gap-3"}>
        {step > 0 ? (
          <Button
            className={step >= 2 ? "w-full" : "flex-1"}
            type="button"
            variant="secondary"
            onClick={() => {
              setClientError(null);
              setStep((current) => current - 1);
            }}
          >
            Back
          </Button>
        ) : null}
        {step < steps.length - 1 ? (
          <>
            {step >= 2 ? (
              <Button className="w-full" type="button" variant="secondary" onClick={skipCurrentReview}>
                Skip review
              </Button>
            ) : null}
            <Button
              className={step >= 2 ? "w-full" : "flex-1"}
              type="button"
              onClick={goNext}
              disabled={checkingEmail}
            >
              {checkingEmail ? "Checking..." : "Continue"}
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full"
              type="button"
              variant="secondary"
              onClick={skipAndSubmitCurrentReview}
            >
              Skip and create account
            </Button>
            <Button
              className="w-full"
              type="submit"
              onClick={(event) => {
                const error = validateStep(step);
                if (error) {
                  event.preventDefault();
                  setClientError(error);
                } else {
                  setClientError(null);
                }
              }}
            >
              Create account
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

function ReviewStep({
  reviewNumber,
  review,
  onChange,
}: {
  reviewNumber: number;
  review: ReviewDraft;
  onChange: (patch: Partial<ReviewDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Client review {reviewNumber}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add a testimonial that can appear on your webinar landing page, or skip this and add it later in Settings.
        </p>
      </div>
      <Input
        label="Reviewer name"
        value={review.reviewerName}
        onChange={(event) => onChange({ reviewerName: event.target.value })}
      />
      <Input
        label="Borrower type / reviewer context (optional)"
        value={review.reviewerContext}
        onChange={(event) => onChange({ reviewerContext: event.target.value })}
        placeholder="First-time buyer"
        hint="Optional. Examples: First-time buyer, Investor, Self-employed borrower, Realtor partner."
      />
      <Textarea
        label="Review text"
        value={review.reviewText}
        onChange={(event) => onChange({ reviewText: event.target.value })}
        hint="Minimum 20 characters. Keep it specific and believable."
      />
      <Input
        label="Rating"
        type="number"
        min={1}
        max={5}
        value={review.rating}
        onChange={(event) => onChange({ rating: event.target.value })}
        hint="Optional. Defaults to 5."
      />
    </div>
  );
}

function HiddenSignupFields({
  form,
}: {
  form: {
    fullName: string;
    domainPrefix: string;
    email: string;
    password: string;
    shortBio: string;
    profileImagePreviewUrl: string;
    profileImageName: string;
    yearsExperience: string;
    familiesHelped: string;
    totalLoanVolume: string;
    specialtyFocus: string;
    licenseStates: string;
    reviews: ReviewDraft[];
  };
}) {
  return (
    <>
      <input type="hidden" name="full_name" value={form.fullName} />
      <input type="hidden" name="domain_prefix" value={form.domainPrefix} />
      <input type="hidden" name="email" value={form.email} />
      <input type="hidden" name="password" value={form.password} />
      <input type="hidden" name="short_bio" value={form.shortBio} />
      <input type="hidden" name="years_experience" value={form.yearsExperience} />
      <input type="hidden" name="families_helped" value={form.familiesHelped} />
      <input type="hidden" name="total_loan_volume" value={form.totalLoanVolume} />
      <input type="hidden" name="specialty_focus" value={form.specialtyFocus} />
      <input type="hidden" name="license_states" value={form.licenseStates} />
      {form.reviews.map((review, index) => {
        const idx = index + 1;
        return (
          <span key={idx}>
            <input type="hidden" name={`reviewer_name_${idx}`} value={review.reviewerName} />
            <input type="hidden" name={`reviewer_context_${idx}`} value={review.reviewerContext} />
            <input type="hidden" name={`review_text_${idx}`} value={review.reviewText} />
            <input type="hidden" name={`rating_${idx}`} value={review.rating} />
          </span>
        );
      })}
    </>
  );
}
