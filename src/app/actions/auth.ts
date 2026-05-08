"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { domainPrefixSchema, optionalDomainPrefixSchema } from "@/domain/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { ensureDefaultReminderTemplatesForUser } from "@/server/services/reminders";

type AuthFormState = {
  error: string | null;
  message: string | null;
};

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  fullName: z.string().trim().min(1, "Full name is required."),
  domainPrefix: domainPrefixSchema,
  shortBio: z
    .string()
    .trim()
    .min(20, "Bio is required. Add at least 2 sentences so attendees know why to trust you."),
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

function imageExtension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

function getProfileImageFile(formData: FormData) {
  const value = formData.get("profile_image_file");
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

async function uploadProfileImage(
  userId: string,
  file: File,
): Promise<{ error: string } | { publicUrl: string }> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSizeBytes = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return { error: "Upload a JPG, PNG, WebP, or GIF profile image." };
  }

  if (file.size > maxSizeBytes) {
    return { error: "Profile image must be 5MB or smaller." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Profile image could not be uploaded because the service role key is missing." };
  }

  const path = `${userId}/headshot-${Date.now()}.${imageExtension(file.type)}`;
  const { error } = await admin.storage
    .from("profile-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return { error: error.message ?? "Could not upload profile image." };
  }

  const { data } = admin.storage.from("profile-images").getPublicUrl(path);
  return { publicUrl: data.publicUrl };
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

export async function signUp(_prev: unknown, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("full_name") ?? ""),
    domainPrefix: String(formData.get("domain_prefix") ?? ""),
    shortBio: String(formData.get("short_bio") ?? ""),
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

  const profileImageFile = getProfileImageFile(formData);
  const profileImageResult = profileImageFile
    ? await uploadProfileImage(data.user.id, profileImageFile)
    : null;

  if (profileImageResult && "error" in profileImageResult) {
    return { error: profileImageResult.error, message: null };
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
    domain_prefix: parsed.data.domainPrefix,
    short_bio: parsed.data.shortBio,
    years_experience: optionalNumber(parsed.data.yearsExperience),
    families_helped: optionalNumber(parsed.data.familiesHelped),
    total_loan_volume: optionalText(parsed.data.totalLoanVolume),
    specialty_focus: optionalText(parsed.data.specialtyFocus),
    license_states: optionalText(parsed.data.licenseStates),
    profile_image_url: profileImageResult?.publicUrl ?? null,
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

export async function updateDomainPrefix(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const parsed = optionalDomainPrefixSchema.safeParse(String(formData.get("domain_prefix") ?? ""));
  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ domain_prefix: parsed.data })
    .eq("id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/settings");
}
