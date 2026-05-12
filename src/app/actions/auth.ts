"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { optionalDomainPrefixSchema } from "@/domain/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { ensureDefaultReminderTemplatesForUser } from "@/server/services/reminders";

type AuthFormState = {
  error: string | null;
  message: string | null;
};

export type PasswordResetState = {
  error: string | null;
  message: string | null;
};

export type SignupEmailCheckState = {
  ok: boolean;
  error: string | null;
};

export type SettingsFormState = {
  error: string | null;
  message: string | null;
  profile?: {
    firstName: string;
    lastName: string;
    companyName: string;
    phone: string;
    shortBio: string;
    profileImageUrl?: string | null;
  };
  domainPrefix?: string | null;
  emailSettings?: {
    fromName: string;
    replyToEmail: string;
  };
  testimonials?: Array<{
    reviewerName: string;
    reviewerContext: string;
    reviewText: string;
    rating: string;
  }>;
};

const profileSettingsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  companyName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  shortBio: z.string().trim().optional(),
});

const emailSettingsSchema = z.object({
  fromName: z.string().trim().min(1, "From name is required."),
  replyToEmail: z.string().trim().email("Enter a valid reply-to email."),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: z.string().trim().min(7, "Phone number is required."),
});

const testimonialsSettingsSchema = z.object({
  reviews: z
    .array(
      z.object({
        reviewerName: z.string().trim(),
        reviewerContext: z.string().trim().optional(),
        reviewText: z.string().trim(),
        rating: z.union([z.coerce.number().int().min(1).max(5), z.literal("")]),
      }),
    )
    .length(3),
}).superRefine((value, ctx) => {
  value.reviews.forEach((review, index) => {
    const hasAnyReviewInput =
      review.reviewerName.length > 0 ||
      review.reviewText.length > 0 ||
      (review.reviewerContext?.length ?? 0) > 0;

    if (!hasAnyReviewInput) {
      return;
    }

    if (!review.reviewerName) {
      ctx.addIssue({
        code: "custom",
        path: ["reviews", index, "reviewerName"],
        message: `Review ${index + 1} needs a reviewer name.`,
      });
    }

    if (review.reviewText.length < 20) {
      ctx.addIssue({
        code: "custom",
        path: ["reviews", index, "reviewText"],
        message: `Review ${index + 1} needs at least 20 characters of review text.`,
      });
    }
  });
});

function optionalText(value: string | undefined) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

async function appBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return undefined;

  const proto = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function parseReviewsFromFormData(formData: FormData) {
  return [1, 2, 3].map((idx) => ({
    reviewerName: String(formData.get(`reviewer_name_${idx}`) ?? ""),
    reviewerContext: String(formData.get(`reviewer_context_${idx}`) ?? ""),
    reviewText: String(formData.get(`review_text_${idx}`) ?? ""),
    rating: String(formData.get(`rating_${idx}`) ?? ""),
  }));
}

function completedReviews(
  reviews: Array<{
    reviewerName: string;
    reviewerContext?: string;
    reviewText: string;
    rating: number | "";
  }>,
) {
  return reviews.filter(
    (review) => review.reviewerName.trim().length > 0 && review.reviewText.trim().length >= 20,
  );
}

function isExistingSignupUser(user: unknown) {
  if (!user || typeof user !== "object" || !("identities" in user)) {
    return false;
  }

  const identities = (user as { identities?: unknown }).identities;
  return Array.isArray(identities) && identities.length === 0;
}

function accountAlreadyExistsMessage() {
  return "An account already exists for that email. Sign in instead, or use Forgot password if you need to reset it.";
}

export async function checkSignupEmail(email: string): Promise<SignupEmailCheckState> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: true, error: null };
  }

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error("Signup email precheck failed:", error.message);
    return { ok: true, error: null };
  }

  const normalized = parsed.data.email.toLowerCase();
  const exists = data.users.some((user) => user.email?.toLowerCase() === normalized);
  return exists ? { ok: false, error: accountAlreadyExistsMessage() } : { ok: true, error: null };
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

export async function requestPasswordReset(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      message: null,
    };
  }

  const supabase = await createClient();
  const siteUrl = await appBaseUrl();
  const redirectTo = siteUrl
    ? `${siteUrl}/auth/callback?next=/reset-password`
    : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  return {
    error: null,
    message: "If that email exists, we sent a password reset link.",
  };
}

export async function updatePassword(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirm_password") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a new password.",
      message: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Your reset link expired or was not opened correctly. Request a new password reset link.",
      message: null,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return {
    error: null,
    message: "Password updated. You can now sign in with your new password.",
  };
}

export async function signUp(_prev: unknown, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("first_name") ?? ""),
    lastName: String(formData.get("last_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please complete the required signup fields.",
      message: null,
    };
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: fullName, phone: parsed.data.phone },
      emailRedirectTo: siteUrl ? `${siteUrl.replace(/\/$/, "")}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  if (!data.user) {
    return { error: "Account was created, but Supabase did not return a user ID.", message: null };
  }

  if (isExistingSignupUser(data.user)) {
    return { error: accountAlreadyExistsMessage(), message: null };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Account created, but profile setup could not be saved because the service role key is missing.",
      message: null,
    };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    phone: parsed.data.phone,
  });

  if (profileError) {
    if (profileError.code === "23503" || profileError.message.includes("profiles_id_fkey")) {
      return { error: accountAlreadyExistsMessage(), message: null };
    }
    return { error: profileError.message, message: null };
  }

  await ensureDefaultReminderTemplatesForUser(data.user.id);

  revalidatePath("/", "layout");
  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error: null,
    message:
      "Check your email to confirm your account, then sign in. If email confirmation is disabled in Supabase, you can sign in immediately.",
  };
}

export async function updateDomainPrefix(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in.", message: null };
  }

  const parsed = optionalDomainPrefixSchema.safeParse(String(formData.get("domain_prefix") ?? ""));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid domain prefix.", message: null };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server is missing the Supabase service role key.", message: null };
  }

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      domain_prefix: parsed.data,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: error.message, message: null };
  }

  revalidatePath("/settings");
  return { error: null, message: "Domain saved.", domainPrefix: parsed.data };
}

export async function updateProfileSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in.", message: null };
  }

  const parsed = profileSettingsSchema.safeParse({
    firstName: String(formData.get("first_name") ?? ""),
    lastName: String(formData.get("last_name") ?? ""),
    companyName: String(formData.get("company_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    shortBio: String(formData.get("short_bio") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete your profile.", message: null };
  }

  const imageFile = getProfileImageFile(formData);
  const imageResult = imageFile ? await uploadProfileImage(user.id, imageFile) : null;
  if (imageResult && "error" in imageResult) {
    return { error: imageResult.error, message: null };
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server is missing the Supabase service role key.", message: null };
  }

  const update: {
    full_name: string;
    company_name: string | null;
    phone: string | null;
    short_bio: string | null;
    profile_image_url?: string;
  } = {
    full_name: fullName,
    company_name: optionalText(parsed.data.companyName),
    phone: optionalText(parsed.data.phone),
    short_bio: optionalText(parsed.data.shortBio),
  };

  if (imageResult && "publicUrl" in imageResult) {
    update.profile_image_url = imageResult.publicUrl;
  }

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      ...update,
    },
    { onConflict: "id" },
  );
  if (error) {
    return { error: error.message, message: null };
  }

  revalidatePath("/settings");
  revalidatePath("/webinars/new");
  return {
    error: null,
    message: "Profile saved.",
    profile: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      companyName: parsed.data.companyName ?? "",
      phone: parsed.data.phone ?? "",
      shortBio: parsed.data.shortBio ?? "",
      ...(imageResult && "publicUrl" in imageResult
        ? { profileImageUrl: imageResult.publicUrl }
        : {}),
    },
  };
}

export async function updateEmailSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in.", message: null };
  }

  const parsed = emailSettingsSchema.safeParse({
    fromName: String(formData.get("from_name") ?? ""),
    replyToEmail: String(formData.get("reply_to_email") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your email settings.", message: null };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server is missing the Supabase service role key.", message: null };
  }

  const { error } = await admin.from("user_email_settings").upsert(
    {
      user_id: user.id,
      email_provider: "platform_resend",
      from_name: parsed.data.fromName,
      from_email:
        process.env.FALLBACK_FROM_EMAIL ||
        `team@${process.env.EMAIL_FROM_DOMAIN || "arc-mortgage.com"}`,
      reply_to_email: parsed.data.replyToEmail,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: error.message, message: null };
  }

  revalidatePath("/settings");
  return {
    error: null,
    message: "Email settings saved.",
    emailSettings: {
      fromName: parsed.data.fromName,
      replyToEmail: parsed.data.replyToEmail,
    },
  };
}

export async function updateTestimonialsSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in.", message: null };
  }

  const parsed = testimonialsSettingsSchema.safeParse({
    reviews: parseReviewsFromFormData(formData),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check your reviews.",
      message: null,
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server is missing the Supabase service role key.", message: null };
  }

  const reviewsToSave = completedReviews(parsed.data.reviews);
  const filledOrders = reviewsToSave.map((_, index) => index + 1);

  if (reviewsToSave.length > 0) {
    const { error: upsertError } = await admin.from("testimonials").upsert(
      reviewsToSave.map((review, index) => ({
        user_id: user.id,
        reviewer_name: review.reviewerName,
        reviewer_context: optionalText(review.reviewerContext),
        review_text: review.reviewText,
        rating: review.rating === "" ? 5 : review.rating,
        display_order: index + 1,
      })),
      { onConflict: "user_id,display_order" },
    );

    if (upsertError) {
      return { error: upsertError.message, message: null };
    }
  }

  const deleteQuery = admin.from("testimonials").delete().eq("user_id", user.id);
  const { error: deleteError } =
    filledOrders.length > 0
      ? await deleteQuery.not("display_order", "in", `(${filledOrders.join(",")})`)
      : await deleteQuery;

  if (deleteError) {
    return { error: deleteError.message, message: null };
  }

  revalidatePath("/settings");
  revalidatePath("/w/[slug]", "page");
  return {
    error: null,
    message: "Reviews saved.",
    testimonials: [0, 1, 2].map((index) => {
      const review = reviewsToSave[index];
      return {
        reviewerName: review?.reviewerName ?? "",
        reviewerContext: review?.reviewerContext ?? "",
        reviewText: review?.reviewText ?? "",
        rating: review?.rating === "" || review?.rating == null ? "5" : String(review.rating),
      };
    }),
  };
}
