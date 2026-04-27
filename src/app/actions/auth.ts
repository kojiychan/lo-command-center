"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultReminderTemplatesForUser } from "@/server/services/reminders";

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  fullName: z.string().trim().min(1, "Full name is required."),
  shortBio: z
    .string()
    .trim()
    .min(20, "Bio is required. Add at least 2 sentences so attendees know why to trust you."),
  profileImageUrl: z.union([z.string().trim().url("Enter a valid image URL."), z.literal("")]),
  yearsExperience: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Years experience must be a whole number.")
    .transform((value) => (value === "" ? "" : Number(value))),
  familiesHelped: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Families helped must be a whole number.")
    .transform((value) => (value === "" ? "" : Number(value))),
  totalLoanVolume: z.string().trim().optional(),
  specialtyFocus: z.string().trim().optional(),
  licenseStates: z.string().trim().optional(),
  reviews: z.array(
    z.object({
      reviewerName: z.string().trim().min(1, "Reviewer name is required."),
      reviewerContext: z.string().trim().optional(),
      reviewText: z.string().trim().min(20, "Review text should be at least 20 characters."),
      rating: z.union([z.coerce.number().int().min(1).max(5), z.literal("")]),
    }),
  ).length(3),
});

function optionalNumber(value: number | "") {
  return value === "" ? null : value;
}

function optionalText(value: string | undefined) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message } as { error: string };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureDefaultReminderTemplatesForUser(user.id);
  }

  revalidatePath("/", "layout");

  const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard";
  redirect(next);
}

export async function signUp(_prev: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("full_name") ?? ""),
    shortBio: String(formData.get("short_bio") ?? ""),
    profileImageUrl: String(formData.get("profile_image_url") ?? ""),
    yearsExperience: String(formData.get("years_experience") ?? ""),
    familiesHelped: String(formData.get("families_helped") ?? ""),
    totalLoanVolume: String(formData.get("total_loan_volume") ?? ""),
    specialtyFocus: String(formData.get("specialty_focus") ?? ""),
    licenseStates: String(formData.get("license_states") ?? ""),
    reviews: [1, 2, 3].map((idx) => ({
      reviewerName: String(formData.get(`reviewer_name_${idx}`) ?? ""),
      reviewerContext: String(formData.get(`reviewer_context_${idx}`) ?? ""),
      reviewText: String(formData.get(`review_text_${idx}`) ?? ""),
      rating: String(formData.get(`rating_${idx}`) ?? ""),
    })),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please complete the required onboarding fields.",
      message: null,
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: siteUrl ? `${siteUrl.replace(/\/$/, "")}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  if (!data.user) {
    return { error: "Account was created, but Supabase did not return a user ID.", message: null };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Account created, but presenter onboarding could not be saved because the service role key is missing.",
      message: null,
    };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    short_bio: parsed.data.shortBio,
    years_experience: optionalNumber(parsed.data.yearsExperience),
    families_helped: optionalNumber(parsed.data.familiesHelped),
    total_loan_volume: optionalText(parsed.data.totalLoanVolume),
    specialty_focus: optionalText(parsed.data.specialtyFocus),
    license_states: optionalText(parsed.data.licenseStates),
    profile_image_url: parsed.data.profileImageUrl || null,
  });

  if (profileError) {
    return { error: profileError.message, message: null };
  }

  const { error: testimonialsError } = await admin.from("testimonials").upsert(
    parsed.data.reviews.map((review, index) => ({
      user_id: data.user!.id,
      reviewer_name: review.reviewerName,
      reviewer_context: optionalText(review.reviewerContext),
      review_text: review.reviewText,
      rating: review.rating === "" ? 5 : review.rating,
      display_order: index + 1,
    })),
    { onConflict: "user_id,display_order" },
  );

  if (testimonialsError) {
    return { error: testimonialsError.message, message: null };
  }

  await ensureDefaultReminderTemplatesForUser(data.user.id);

  revalidatePath("/", "layout");
  return {
    error: null,
    message:
      "Check your email to confirm your account, then sign in. If email confirmation is disabled in Supabase, you can sign in immediately.",
  };
}
