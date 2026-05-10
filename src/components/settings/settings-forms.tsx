"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  updateDomainPrefix,
  updateProfileSettings,
  type SettingsFormState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { WEBINAR_BASE_DOMAIN, formatWebinarDomain } from "@/domain/profiles";

type ProfileSettingsFormProps = {
  firstName: string;
  lastName: string;
  companyName: string;
  profileImageUrl: string | null;
};

type DomainSettingsFormProps = {
  domainPrefix: string;
};

const initialState: SettingsFormState = {
  error: null,
  message: null,
};

export function ProfileSettingsForm({
  firstName,
  lastName,
  companyName,
  profileImageUrl,
}: ProfileSettingsFormProps) {
  const [profileState, profileAction] = useFormState(updateProfileSettings, initialState);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    firstName,
    lastName,
    companyName,
    profileImageUrl,
  });

  useEffect(() => {
    if (profileState.profile) {
      setValues((current) => ({
        firstName: profileState.profile?.firstName ?? current.firstName,
        lastName: profileState.profile?.lastName ?? current.lastName,
        companyName: profileState.profile?.companyName ?? current.companyName,
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

export function DomainSettingsForm({ domainPrefix }: DomainSettingsFormProps) {
  const [domainState, domainAction] = useFormState(updateDomainPrefix, initialState);
  const [value, setValue] = useState(domainPrefix);

  useEffect(() => {
    if (typeof domainState.domainPrefix !== "undefined") {
      setValue(domainState.domainPrefix ?? "");
    }
  }, [domainState.domainPrefix]);

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
