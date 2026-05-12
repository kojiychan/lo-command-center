"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  updateDomainPrefix,
  updateEmailSettings,
  updateProfileSettings,
  updateTestimonialsSettings,
  type SettingsFormState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { WEBINAR_BASE_DOMAIN, formatWebinarDomain } from "@/domain/profiles";

type ProfileSettingsFormProps = {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  shortBio: string;
  profileImageUrl: string | null;
};

type DomainSettingsFormProps = {
  domainPrefix: string;
  companyName: string;
};

type EmailSettingsFormProps = {
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
};

type TestimonialDraft = {
  reviewerName: string;
  reviewerContext: string;
  reviewText: string;
  rating: string;
};

type TestimonialsSettingsFormProps = {
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

const initialState: SettingsFormState = {
  error: null,
  message: null,
};

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)})${digits.slice(3)}`;

  return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function domainPrefixFromCompany(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 63);
}

export function ProfileSettingsForm({
  firstName,
  lastName,
  companyName,
  phone,
  shortBio,
  profileImageUrl,
}: ProfileSettingsFormProps) {
  const [profileState, profileAction] = useFormState(updateProfileSettings, initialState);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    firstName,
    lastName,
    companyName,
    phone: formatPhoneNumber(phone),
    shortBio,
    profileImageUrl,
  });

  useEffect(() => {
    if (profileState.profile) {
      setValues((current) => ({
        firstName: profileState.profile?.firstName ?? current.firstName,
        lastName: profileState.profile?.lastName ?? current.lastName,
        companyName: profileState.profile?.companyName ?? current.companyName,
        phone: formatPhoneNumber(profileState.profile?.phone ?? current.phone),
        shortBio: profileState.profile?.shortBio ?? current.shortBio,
        profileImageUrl:
          profileState.profile && "profileImageUrl" in profileState.profile
            ? profileState.profile.profileImageUrl ?? null
            : current.profileImageUrl,
      }));
      setEditing(false);
    }
  }, [profileState.profile]);

  return (
    <form action={profileAction} encType="multipart/form-data" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">First name</span>
            <input
              name="first_name"
              value={values.firstName}
              onChange={(event) => setValues({ ...values, firstName: event.target.value })}
              readOnly={!editing}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 read-only:bg-slate-50 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</span>
            <input
              name="last_name"
              value={values.lastName}
              onChange={(event) => setValues({ ...values, lastName: event.target.value })}
              readOnly={!editing}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 read-only:bg-slate-50 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
            <input
              name="phone"
              type="tel"
              value={values.phone}
              onChange={(event) =>
                setValues({ ...values, phone: formatPhoneNumber(event.target.value) })
              }
              readOnly={!editing}
              placeholder="(555)555-1212"
              maxLength={13}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 read-only:bg-slate-50 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
            <input
              name="company_name"
              value={values.companyName}
              onChange={(event) => setValues({ ...values, companyName: event.target.value })}
              readOnly={!editing}
              placeholder="ARC Mortgage"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 read-only:bg-slate-50 focus:border-emerald-500 focus:ring-4"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Presenter bio
            </span>
            <textarea
              name="short_bio"
              value={values.shortBio}
              onChange={(event) => setValues({ ...values, shortBio: event.target.value })}
              readOnly={!editing}
              placeholder={samplePresenterBio}
              rows={5}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 read-only:bg-slate-50 focus:border-emerald-500 focus:ring-4"
            />
            <span className="text-xs text-slate-500">
              Optional. This appears in the Meet Your Presenter section on webinar pages.
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          {values.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.profileImageUrl}
              alt=""
              className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Photo
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {profileImageUrl ? "Replace image" : "Upload image"}
            </span>
            <input
              name="profile_image_file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={!editing}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/30"
            />
            <span className="text-xs text-slate-500">JPG, PNG, WebP, or GIF up to 5MB.</span>
          </label>
        </div>

        <SettingsNotice state={profileState} />

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => setEditing((current) => !current)}
          >
            {editing ? "Cancel edit" : "Edit"}
          </Button>
          <Button size="sm" type="submit">
            Save profile
          </Button>
        </div>
    </form>
  );
}

export function DomainSettingsForm({ domainPrefix, companyName }: DomainSettingsFormProps) {
  const [domainState, domainAction] = useFormState(updateDomainPrefix, initialState);
  const initialPrefix = domainPrefix || domainPrefixFromCompany(companyName);
  const [value, setValue] = useState(initialPrefix);

  useEffect(() => {
    if (typeof domainState.domainPrefix !== "undefined") {
      setValue(domainState.domainPrefix ?? "");
    }
  }, [domainState.domainPrefix]);

  useEffect(() => {
    setValue(domainPrefix || domainPrefixFromCompany(companyName));
  }, [companyName, domainPrefix]);

  return (
    <form action={domainAction} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Domain prefix
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              name="domain_prefix"
              value={value}
              onChange={(event) => setValue(event.target.value.toLowerCase())}
              required
              maxLength={63}
              pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
              placeholder="arcmortgage"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4 sm:max-w-xs"
            />
            <span className="text-sm text-slate-600">.{WEBINAR_BASE_DOMAIN}</span>
          </div>
        </label>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Current domain:{" "}
          <span className="font-semibold text-slate-900">
            {formatWebinarDomain(value)}
          </span>
        </div>
        <SettingsNotice state={domainState} />
        <div className="flex justify-end">
          <Button size="sm" type="submit">
            Save domain
          </Button>
        </div>
    </form>
  );
}

export function EmailSettingsForm({
  fromName,
  fromEmail,
  replyToEmail,
}: EmailSettingsFormProps) {
  const [emailState, emailAction] = useFormState(updateEmailSettings, initialState);
  const [values, setValues] = useState({
    fromName,
    replyToEmail,
  });

  useEffect(() => {
    if (emailState.emailSettings) {
      setValues({
        fromName: emailState.emailSettings.fromName,
        replyToEmail: emailState.emailSettings.replyToEmail,
      });
    }
  }, [emailState.emailSettings]);

  return (
    <form action={emailAction} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From name
          </span>
          <input
            name="from_name"
            value={values.fromName}
            onChange={(event) => setValues({ ...values, fromName: event.target.value })}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reply-to email
          </span>
          <input
            name="reply_to_email"
            type="email"
            value={values.replyToEmail}
            onChange={(event) => setValues({ ...values, replyToEmail: event.target.value })}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700">
        <div>
          Current provider: <span className="font-semibold text-slate-900">Platform Email</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Emails send from {fromEmail}; replies go to your reply-to address.
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="button" variant="secondary" disabled>
          Connect Gmail · Coming soon
        </Button>
        <Button size="sm" type="button" variant="secondary" disabled>
          Connect Outlook · Coming soon
        </Button>
      </div>

      <SettingsNotice state={emailState} />

      <div className="flex justify-end">
        <Button size="sm" type="submit">
          Save email settings
        </Button>
      </div>
    </form>
  );
}

export function TestimonialsSettingsForm({ testimonials }: TestimonialsSettingsFormProps) {
  const [testimonialsState, testimonialsAction] = useFormState(
    updateTestimonialsSettings,
    initialState,
  );
  const [values, setValues] = useState<TestimonialDraft[]>(
    [0, 1, 2].map((index) => testimonials[index] ?? blankTestimonial()),
  );

  useEffect(() => {
    if (testimonialsState.testimonials) {
      setValues([0, 1, 2].map((index) => testimonialsState.testimonials?.[index] ?? blankTestimonial()));
    }
  }, [testimonialsState.testimonials]);

  function updateReview(index: number, patch: Partial<TestimonialDraft>) {
    setValues((current) =>
      current.map((review, reviewIndex) =>
        reviewIndex === index ? { ...review, ...patch } : review,
      ),
    );
  }

  function clearReview(index: number) {
    setValues((current) =>
      current.map((review, reviewIndex) => (reviewIndex === index ? blankTestimonial() : review)),
    );
  }

  return (
    <form action={testimonialsAction} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {values.map((review, index) => {
          const number = index + 1;
          return (
            <div key={number} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">Review {number}</div>
                <button
                  type="button"
                  onClick={() => clearReview(index)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reviewer name
                  </span>
                  <input
                    name={`reviewer_name_${number}`}
                    value={review.reviewerName}
                    onChange={(event) => updateReview(index, { reviewerName: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Context
                  </span>
                  <input
                    name={`reviewer_context_${number}`}
                    value={review.reviewerContext}
                    onChange={(event) => updateReview(index, { reviewerContext: event.target.value })}
                    placeholder="First-time buyer"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Review text
                  </span>
                  <textarea
                    name={`review_text_${number}`}
                    value={review.reviewText}
                    onChange={(event) => updateReview(index, { reviewText: event.target.value })}
                    rows={5}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rating
                  </span>
                  <input
                    name={`rating_${number}`}
                    type="number"
                    min={1}
                    max={5}
                    value={review.rating}
                    onChange={(event) => updateReview(index, { rating: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Reviews are optional. Filled reviews need a reviewer name and at least 20 characters of review text.
      </p>

      <SettingsNotice state={testimonialsState} />

      <div className="flex justify-end">
        <Button size="sm" type="submit">
          Save reviews
        </Button>
      </div>
    </form>
  );
}

function SettingsNotice({ state }: { state: SettingsFormState }) {
  if (state.message) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
        {state.message}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
        {state.error}
      </div>
    );
  }

  return null;
}
